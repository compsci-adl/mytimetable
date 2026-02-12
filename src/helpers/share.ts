import type { useDetailedEnrolledCourses } from '../data/enrolled-courses';

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
};

type SharedCalendarMeetingInternal = SharedCalendarMeeting & { _key: string };

const encodeTimetabletoBase64 = (
	courses: ReturnType<typeof useDetailedEnrolledCourses>,
): string => {
	const shareData = {
		courses,
	};
	const jsonString = JSON.stringify(shareData);
	const base64 = btoa(jsonString);
	return base64;
};

export const decodeTimetablefromBase64 = (
	encodedBase64: string,
): { courses: ReturnType<typeof useDetailedEnrolledCourses> } | null => {
	try {
		const jsonString = atob(encodedBase64);
		const shareData = JSON.parse(jsonString);
		return shareData;
	} catch {
		return null;
	}
};

export const generateShareURL = (
	courses: ReturnType<typeof useDetailedEnrolledCourses>,
): string => {
	const encoded = encodeTimetabletoBase64(courses);
	const url: URL = new URL(window.location.href);
	url.searchParams.set('share', 'true');
	url.searchParams.set('ed', encoded);
	return url.toString();
};

export const getMeetingsByDay = (
	courses: ReturnType<typeof useDetailedEnrolledCourses>,
): Record<string, SharedCalendarMeeting[]> => {
	const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
	const meetingsByDay: Record<string, SharedCalendarMeetingInternal[]> = {};
	days.forEach((day) => (meetingsByDay[day] = []));

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

					if (!group) {
						group = {
							...meeting,
							courseName: course.name.code ?? '',
							classType: cls.type ?? '',
							classNumber: cls.classNumber ?? '',
							subject: course.name.subject ?? '',
							title: course.name.title ?? '',
							available_seats: cls.available_seats ?? '',
							size: cls.size ?? '',
							dateRanges: [],
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
		result[day] = meetingsByDay[day].map(({ _key, ...rest }) => rest);
	});

	return result;
};
