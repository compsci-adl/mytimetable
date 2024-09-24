import type { DateTimeRange } from '../types/course';
import { timeToDayjs } from './date';

export const calcHoursDuration = (range: DateTimeRange) => {
	const start = timeToDayjs(range.start);
	const end = timeToDayjs(range.end);
	return end.diff(start, 'minute') / 60;
};
