import type { DateTimeRange } from '../types/course';
import { timeToDayjs } from './date';

// TODO: Use this function to check if courses clash in a day
/**
 * Check if two time ranges overlap
 * @param a
 * @param b
 */
export const timeOverlap = (a: DateTimeRange, b: DateTimeRange) => {
	const aStart = timeToDayjs(a.start);
	const aEnd = timeToDayjs(a.end);
	const bStart = timeToDayjs(b.start);
	const bEnd = timeToDayjs(b.end);
	return aEnd.isAfter(bStart) && bEnd.isAfter(aStart);
};
