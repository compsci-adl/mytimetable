export type Meeting = {
	day: string;
	location: string;
	date: { start: string; end: string };
	time: { start: string; end: string };
};
export type Meetings = Array<Meeting>;

export type Course = {
	id: string;
	course_id: string;
	name: {
		subject: string;
		code: string;
		title: string;
	};
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
