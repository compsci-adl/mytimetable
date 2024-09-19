type WeekDay = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

type Meeting = {
	day: WeekDay;
	location: string;
	date: { start: string; end: string };
	time: { start: string; end: string };
};
export type Meetings = Array<Meeting>;
export type CourseName = {
	subject: string;
	code: string;
	title: string;
};

export type Course = {
	id: string;
	course_id: string;
	name: CourseName;
	class_number: number;
	year: number;
	term: string;
	campus: string;
	units: number;
	requirements: unknown;
	class_list: Array<{
		id: string;
		type: string;
		classes: Array<{
			number: string;
			meetings: Meetings;
		}>;
	}>;
};

export type DetailedEnrolledCourse = {
	id: string;
	name: CourseName;
	classes: Array<{ id: string; type: string; meetings: Meetings }>;
};

export type WeekCourse = {
	id: string;
	name: CourseName;
	classId: string;
	classType: string;
	location: string;
	time: { start: string; end: string };
};
export type WeekCourses = Record<WeekDay, Array<WeekCourse>>;
