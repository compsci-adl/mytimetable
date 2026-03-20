import dayjs from 'dayjs';

import { COURSE_COLORS } from '../constants/course-colors';
import type { useDetailedEnrolledCourses } from '../data/enrolled-courses';

type ColorOptions = {
	bg: string;
	border: string;
	text: string;
	dot: string;
};

export type SharedCalendarMeeting = {
	available_seats: string;
	campus: string;
	classNumber: string;
	classType: string;
	courseName: string;
	date: { start: string; end: string };
	dateRanges: Array<{ start: string; end: string }>;
	day: string;
	location: string;
	size: string;
	subject: string;
	time: { start: string; end: string };
	title: string;
	color: ColorOptions;
};

type SharedCalendarMeetingInternal = SharedCalendarMeeting & { _key: string };

const encodeTimetableToBase64 = (
	courses: ReturnType<typeof useDetailedEnrolledCourses>,
): string => {
	const shareData = {
		courses,
	};
	const jsonString = JSON.stringify(shareData);
	const base64 = btoa(encodeURIComponent(jsonString));
	return base64;
};

export const decodeTimetableFromBase64 = (
	encodedBase64: string,
): { courses: ReturnType<typeof useDetailedEnrolledCourses> } | null => {
	try {
		const jsonString = decodeURIComponent(atob(encodedBase64));
		const shareData = JSON.parse(jsonString);
		return shareData;
	} catch {
		return null;
	}
};

export const generateShareURL = (
	courses: ReturnType<typeof useDetailedEnrolledCourses>,
): string => {
	const encoded = encodeTimetableToBase64(courses);
	const url: URL = new URL(window.location.href);
	url.searchParams.set('share', 'true');
	url.hash = `ed=${encoded}`;
	return url.toString();
};

export const getMeetingsByDay = (
	courses: ReturnType<typeof useDetailedEnrolledCourses>,
): Record<string, SharedCalendarMeeting[]> => {
	const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
	const meetingsByDay: Record<string, SharedCalendarMeetingInternal[]> = {};
	days.forEach((day) => (meetingsByDay[day] = []));
	const clrTracker: Map<string, ColorOptions> = new Map([]);
	let clrIndex: number = 0;

	courses.forEach((course) => {
		course.classes.forEach((cls) => {
			cls.meetings.forEach((meeting) => {
				const day = meeting.day;
				if (meetingsByDay[day]) {
					const key = [
						course.id,
						cls.typeId,
						cls.classNumber,
						day,
						meeting.time.start,
						meeting.time.end,
						meeting.location,
						meeting.campus,
					].join('|');

					let group = meetingsByDay[day].find((m) => m._key === key);

					if (!clrTracker.has(course.id)) {
						clrTracker.set(course.id, COURSE_COLORS[clrIndex]);
						clrIndex++;
					}

					if (!group) {
						group = {
							...meeting,
							time: {
								start: dayjs(meeting.time.start, 'HH:mm').format('h:mm A'),
								end: dayjs(meeting.time.end, 'HH:mm').format('h:mm A'),
							},
							courseName: course.name.code ?? '',
							classType: cls.type ?? '',
							classNumber: cls.classNumber ?? '',
							subject: course.name.subject ?? '',
							title: course.name.title ?? '',
							available_seats: cls.available_seats ?? '',
							size: cls.size ?? '',
							dateRanges: [],
							color: clrTracker.get(course.id)!,
							_key: key,
						};
						meetingsByDay[day].push(group);
					}
					group.dateRanges.push({
						start: meeting.date.start,
						end: meeting.date.end,
					});
				}
			});
		});
	});

	const result: Record<string, SharedCalendarMeeting[]> = {};
	Object.keys(meetingsByDay).forEach((day) => {
		result[day] = meetingsByDay[day]
			.sort(
				(a, b) =>
					dayjs(a.time.start, 'h:mm A').valueOf() -
					dayjs(b.time.start, 'h:mm A').valueOf(),
			)
			.map(({ _key, ...rest }) => rest);
	});

	return result;
};
