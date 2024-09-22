import type { DateTimeRange } from '../src/types/course';
import { timeOverlap } from '../src/utils/time-overlap';

describe('timeOverlap', () => {
	it('should return true if two time ranges overlap', () => {
		const a: DateTimeRange = { start: '01:00', end: '03:00' };
		const b: DateTimeRange = { start: '02:00', end: '04:00' };
		expect(timeOverlap(a, b)).toBe(true);
	});
	it('should return true if two time ranges are same', () => {
		const a: DateTimeRange = { start: '01:00', end: '03:00' };
		const b: DateTimeRange = { start: '01:00', end: '03:00' };
		expect(timeOverlap(a, b)).toBe(true);
	});
	it('should return false if two time ranges just touch', () => {
		const a: DateTimeRange = { start: '01:00', end: '02:00' };
		const b: DateTimeRange = { start: '02:00', end: '03:00' };
		expect(timeOverlap(a, b)).toBe(false);
	});
	it('should return false if time does not overlap', () => {
		const a: DateTimeRange = { start: '01:00', end: '02:00' };
		const b: DateTimeRange = { start: '09:00', end: '10:00' };
		expect(timeOverlap(a, b)).toBe(false);
	});
	it('should return true if b is before a', () => {
		const b: DateTimeRange = { start: '01:00', end: '03:00' };
		const a: DateTimeRange = { start: '02:00', end: '04:00' };
		expect(timeOverlap(a, b)).toBe(true);
	});
});
