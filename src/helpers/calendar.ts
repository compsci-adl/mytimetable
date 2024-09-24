import { useEffect, useState } from 'react';

import { WEEK_DAYS } from '../constants/week-days';
import { useGetCourseClasses } from '../data/course-info';
import { useDetailedEnrolledCourses } from '../data/enrolled-courses';
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

const MAX_DATE = dayjs('6666-06-06');
const MIN_DATE = dayjs('2005-03-12');

/**
 * Get the start date (Monday) of the start and end week
 * @param dates Dates for all enrolled meetings
 * @returns Tuple of dates of the start and end week
 */
export const getStartEndWeek = (
	dates: Array<{ start: string; end: string }>,
): [dayjs.Dayjs, dayjs.Dayjs] => {
	const currentMonday = getMonday(dayjs());
	if (dates.length === 0) return [currentMonday, currentMonday];

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
		c.classes.forEach((cl) => {
			cl.meetings.forEach((m) => {
				const isMeetingInWeek = checkDateRangeInWeek(weekStart, m.date);
				if (!isMeetingInWeek) return;
				const course: WeekCourse = {
					id: c.id,
					name: c.name,
					classTypeId: cl.typeId,
					classType: cl.type,
					location: m.location,
					time: m.time,
					classNumber: cl.classNumber,
				};
				courses[WEEK_DAYS.indexOf(m.day)].push(course);
			});
		});
	});

	// TODO: Remove this sorting after implementing course conflicts #5
	courses.forEach((dayCourses) => {
		// Sort by start time
		dayCourses.sort((a, b) => {
			const aStart = timeToDayjs(a.time.start);
			const bStart = timeToDayjs(b.time.start);
			if (aStart.isBefore(bStart)) return -1;
			if (aStart.isAfter(bStart)) return 1;
			return 0;
		});
		// Sort by duration (shortest first)
		dayCourses.sort((a, b) => {
			const aStart = timeToDayjs(a.time.start);
			const aEnd = timeToDayjs(a.time.end);
			const bStart = timeToDayjs(b.time.start);
			const bEnd = timeToDayjs(b.time.end);
			const aDuration = aStart.diff(aEnd, 'minute');
			const bDuration = bStart.diff(bEnd, 'minute');
			return bDuration - aDuration;
		});
	});

	return courses;
};

export const useCalendar = () => {
	const enrolledCourses = useDetailedEnrolledCourses();

	const dates = enrolledCourses.flatMap((c) =>
		c.classes.flatMap((cl) => cl.meetings.flatMap((m) => m.date)),
	);
	const [startWeek, endWeek] = getStartEndWeek(dates);

	const [currentWeek, setCurrentWeek] = useState(getMonday(dayjs()));

	useEffect(() => {
		if (currentWeek.isBefore(startWeek)) {
			setCurrentWeek(startWeek);
		}
		if (currentWeek.isAfter(endWeek)) {
			setCurrentWeek(endWeek);
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

	return {
		courses,
		currentWeek,
		actions: { prevWeek, nextWeek, goToStartWeek, goToEndWeek },
	};
};

export const useOtherWeekCourseTimes = ({
	courseId,
	classTypeId,
	currentWeek,
	// currentClassNumber,
}: {
	courseId: string;
	classTypeId: string;
	currentWeek: dayjs.Dayjs;
	currentClassNumber: string;
}) => {
	const classes = useGetCourseClasses(courseId, classTypeId);
	if (!classes) return [];
	const times: OtherWeekCoursesTimes = [[], [], [], [], []];
	classes.forEach((cl) => {
		cl.meetings.forEach((m) => {
			// FIXME: Sometimes this will hide the wrong class #6
			// if (cl.number === currentClassNumber) return;
			const isMeetingInWeek = checkDateRangeInWeek(currentWeek, m.date);
			if (!isMeetingInWeek) return;
			const time: OtherWeekCourseTime = {
				classNumber: cl.number,
				time: m.time,
			};
			times[WEEK_DAYS.indexOf(m.day)].push(time);
		});
	});

	return times;
};
