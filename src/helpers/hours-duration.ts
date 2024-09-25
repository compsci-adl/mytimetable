import type { DateTimeRange } from '../types/course';
import { timeToDayjs } from '../utils/date';

export const calcHoursDuration = (range: DateTimeRange) => {
	const start = timeToDayjs(range.start);
	const end = timeToDayjs(range.end);
	const minutes = end.diff(start, 'minute');

	// Convert to hours and round to nearest 0.5
	const hours = minutes / 60;
	return Math.round(hours * 2) / 2;
};
