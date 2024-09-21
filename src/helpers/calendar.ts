import { useEffect, useState } from 'react';

import { useDetailedEnrolledCourses } from '../data/enrolled-courses';
import dayjs from '../lib/dayjs';
import type {
	DetailedEnrolledCourse,
	WeekCourse,
	WeekCourses,
} from '../types/course';
import { dateToDayjs, getMonday } from '../utils/date';

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
	const weekEnd = weekStart.add(4, 'days');
	const courses: WeekCourses = {
		Monday: [],
		Tuesday: [],
		Wednesday: [],
		Thursday: [],
		Friday: [],
	};

	enrolledCourses.forEach((c) => {
		c.classes.forEach((cl) => {
			cl.meetings.forEach((m) => {
				const isMeetingInWeek =
					weekEnd.isSameOrAfter(dateToDayjs(m.date.start)) &&
					weekStart.isSameOrBefore(dateToDayjs(m.date.end));
				if (!isMeetingInWeek) return;
				const course: WeekCourse = {
					id: c.id,
					name: c.name,
					classId: cl.id,
					classType: cl.type,
					location: m.location,
					time: m.time,
				};
				courses[m.day].push(course);
			});
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
	}, [startWeek, endWeek, currentWeek]);

	const nextWeek = () => {
		if (currentWeek.isSame(endWeek)) return;
		setCurrentWeek((c) => c.add(1, 'week'));
	};
	const prevWeek = () => {
		if (currentWeek.isSame(startWeek)) return;
		setCurrentWeek((c) => c.subtract(1, 'week'));
	};

	console.log('currentWeek', enrolledCourses);
	const courses = getWeekCourses(currentWeek, enrolledCourses);
	console.log('courses', courses);

	return { currentWeek, nextWeek, prevWeek, courses };
};
