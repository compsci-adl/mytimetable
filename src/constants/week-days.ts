export const WEEK_DAYS = [
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
] as const;
export type WeekDay = (typeof WEEK_DAYS)[number];
