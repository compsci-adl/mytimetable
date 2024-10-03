import { useEffect, useState } from 'react';
import { create } from 'zustand';

import { WEEK_DAYS } from '../constants/week-days';
import { useGetCourseClasses } from '../data/course-info';
import {
	useDetailedEnrolledCourses,
	useEnrolledCourseClassNumber,
} from '../data/enrolled-courses';
import dayjs from '../lib/dayjs';
import type {
	DateTimeRange,
	DetailedEnrolledCourse,
	OtherWeekCourseTime,
	OtherWeekCoursesTimes,
	WeekCourse,
	WeekCourses,
} from '../types/course';
import { dateToDayjs, getMonday, timeToDayjs } from '../utils/date';

const MAX_DATE = dayjs('2900-12-12');
const MIN_DATE = dayjs('1900-01-01');
const CURRENT_MONDAY = getMonday(dayjs());

/**
 * Get the start date (Monday) of the start and end week
 * @param dates Dates for all enrolled meetings
 * @returns Tuple of dates of the start and end week
 */
export const getStartEndWeek = (
	dates: Array<{ start: string; end: string }>,
): [dayjs.Dayjs, dayjs.Dayjs] => {
	if (dates.length === 0) return [CURRENT_MONDAY, CURRENT_MONDAY];

	let startWeek = MAX_DATE;
	let endWeek = MIN_DATE;
	dates.forEach((date) => {
		const start = dateToDayjs(date.start);
		const end = dateToDayjs(date.end);
		if (start.isBefore(startWeek)) {
			startWeek = start;
		}
		if (end.isAfter(endWeek)) {
			endWeek = end;
		}
	});

	return [getMonday(startWeek), getMonday(endWeek)];
};

const checkDateRangeInWeek = (
	weekStart: dayjs.Dayjs,
	dateRange: DateTimeRange,
) => {
	const weekEnd = weekStart.add(4, 'days');
	return (
		weekEnd.isSameOrAfter(dateToDayjs(dateRange.start)) &&
		weekStart.isSameOrBefore(dateToDayjs(dateRange.end))
	);
};

/**
 * Get courses for each day of the week
 * @param weekStart Start of the week (Monday)
 * @param enrolledCourses All detailed enrolled courses
 * @returns Object with courses for each day of the week
 */
export const getWeekCourses = (
	weekStart: dayjs.Dayjs,
	enrolledCourses: Array<DetailedEnrolledCourse>,
): WeekCourses => {
	const courses: WeekCourses = [[], [], [], [], []];

	enrolledCourses.forEach((c) => {
		c.classes.forEach((cls) => {
			cls.meetings.forEach((m) => {
				const isMeetingInWeek = checkDateRangeInWeek(weekStart, m.date);
				if (!isMeetingInWeek) return;
				const course = courses[WEEK_DAYS.indexOf(m.day)];
				const newCourse: WeekCourse = {
					id: c.id,
					name: c.name,
					classTypeId: cls.typeId,
					classType: cls.type,
					location: m.location,
					classNumber: cls.classNumber,
				};
				const existingTime = course.find(
					(t) => t.time.start === m.time.start && t.time.end === m.time.end,
				);
				if (existingTime) {
					existingTime.courses.push(newCourse);
					return;
				}
				const newTime = m.time;
				course.push({ time: newTime, courses: [newCourse] });
			});
		});
	});

	// TODO: Remove this sorting after implementing course conflicts #5
	courses.forEach((dayCourses) => {
		// Sort by duration (longest first) and start time (earliest first)
		dayCourses.sort((a, b) => {
			const aStart = timeToDayjs(a.time.start);
			const aEnd = timeToDayjs(a.time.end);
			const bStart = timeToDayjs(b.time.start);
			const bEnd = timeToDayjs(b.time.end);

			const aDuration = aEnd.diff(aStart, 'minute');
			const bDuration = bEnd.diff(bStart, 'minute');

			if (aDuration === bDuration) {
				if (aStart.isBefore(bStart)) return -1;
				if (aStart.isAfter(bStart)) return 1;
				return 0;
			}

			return bDuration - aDuration;
		});
	});

	return courses;
};

export const useCalendar = () => {
	const enrolledCourses = useDetailedEnrolledCourses();

	const dates = enrolledCourses.flatMap((c) =>
		c.classes.flatMap((cls) => cls.meetings.flatMap((m) => m.date)),
	);
	const [startWeek, endWeek] = getStartEndWeek(dates);

	const [currentWeek, setCurrentWeek] = useState(CURRENT_MONDAY);

	// Every time enrolled courses change, reset the current week to the start week
	useEffect(() => {
		if (enrolledCourses.length === 0) return;
		setCurrentWeek(startWeek);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [enrolledCourses.length]);

	useEffect(() => {
		if (currentWeek.isBefore(startWeek) || currentWeek.isAfter(endWeek)) {
			setCurrentWeek(startWeek);
		}
		/* eslint-disable react-hooks/exhaustive-deps */
	}, [
		startWeek.format('MMDD'),
		endWeek.format('MMDD'),
		currentWeek.format('MMDD'),
	]);
	/* eslint-enable react-hooks/exhaustive-deps */

	const nextWeek = () => {
		if (currentWeek.isSame(endWeek)) return;
		setCurrentWeek((c) => c.add(1, 'week'));
	};
	const prevWeek = () => {
		if (currentWeek.isSame(startWeek)) return;
		setCurrentWeek((c) => c.subtract(1, 'week'));
	};
	const goToStartWeek = () => {
		setCurrentWeek(startWeek);
	};
	const goToEndWeek = () => {
		setCurrentWeek(endWeek);
	};

	const courses = getWeekCourses(currentWeek, enrolledCourses);

	const isStartWeek = currentWeek.isSame(startWeek);
	const isEndWeek = currentWeek.isSame(endWeek);

	return {
		courses,
		currentWeek,
		actions: { prevWeek, nextWeek, goToStartWeek, goToEndWeek },
		status: { isStartWeek, isEndWeek },
	};
};

export const useOtherWeekCourseTimes = ({
	courseId,
	classTypeId,
	currentWeek,
}: {
	courseId: string;
	classTypeId: string;
	currentWeek: dayjs.Dayjs;
}) => {
	const classes = useGetCourseClasses(courseId, classTypeId);
	const currentClassNumber = useEnrolledCourseClassNumber(
		courseId,
		classTypeId,
	);
	if (!classes) return [];
	const times: OtherWeekCoursesTimes = [[], [], [], [], []];
	classes.forEach((cls) => {
		cls.meetings.forEach((m) => {
			if (cls.number === currentClassNumber) return;
			const isMeetingInWeek = checkDateRangeInWeek(currentWeek, m.date);
			if (!isMeetingInWeek) return;
			const time = times[WEEK_DAYS.indexOf(m.day)];
			const existingTime = time.find(
				(t) => t.time.start === m.time.start && t.time.end === m.time.end,
			);
			const newClass = { number: cls.number, location: m.location };
			if (existingTime) {
				existingTime.classes.push(newClass);
				return;
			}
			const newTime: OtherWeekCourseTime = {
				classes: [newClass],
				time: m.time,
			};
			time.push(newTime);
		});
	});

	return times;
};

export const useCalendarHourHeight = create<{
	height: number;
	setHeight: (getNewHeight: (height: number) => number) => void;
}>()((set) => ({
	height: 4.5,
	setHeight: (getNewHeight) =>
		set((state) => ({ height: getNewHeight(state.height) })),
}));
