import type { WeekDay } from '../constants/week-days';

export type DateTimeRange = { start: string; end: string };

type Meeting = {
	day: WeekDay;
	location: string;
	date: DateTimeRange;
	time: DateTimeRange;
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
	classes: Array<{
		typeId: string;
		type: string;
		classNumber: string;
		meetings: Meetings;
	}>;
};

export type WeekCourse = {
	id: string;
	name: CourseName;
	classTypeId: string;
	classType: string;
	location: string;
	time: DateTimeRange;
	classNumber: string;
};
export type WeekCourses = Array<Array<WeekCourse>>;

export type OtherWeekCourseTime = {
	classes: Array<{ number: string; location: string }>;
	time: DateTimeRange;
};
export type OtherWeekCoursesTimes = Array<Array<OtherWeekCourseTime>>;
