import type { WeekDay } from '../constants/week-days';

export type DateTimeRange = { start: string; end: string };

type Meeting = {
	day: WeekDay;
	location: string;
	campus: string;
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
	university_wide_elective?: boolean;
	course_coordinator?: string;
	course_overview: string;
	level_of_study: 'undergraduate' | 'postgraduate';
	requirements: unknown;
	class_list: Array<{
		id: string;
		category: 'enrolment' | 'related';
		type: string;
		classes: Array<{
			number: string;
			section?: string;
			size?: string;
			available_seats?: string;
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
		size?: string;
		available_seats?: string;
	}>;
};

export type WeekCourse = {
	id: string;
	name: CourseName;
	classTypeId: string;
	classType: string;
	location: string;
	campus: string;
	classNumber: string;
	size?: string;
	available_seats?: string;
};
export type WeekCourses = Array<
	Array<{ time: DateTimeRange; courses: Array<WeekCourse> }>
>;

export type OtherWeekCourseTime = {
	classes: Array<{ number: string; location: string; campus: string }>;
	time: DateTimeRange;
};
export type OtherWeekCoursesTimes = Array<Array<OtherWeekCourseTime>>;
