import { YEAR } from '../constants/year';
import dayjs from '../lib/dayjs';

export const dateToDayjs = (date: string) => {
	return dayjs(date, 'MM-DD').year(YEAR);
};
export const dateRangesOverlap = (
	a?: { start: string; end: string },
	b?: { start: string; end: string },
): boolean => {
	if (!a || !b || !a.start || !a.end || !b.start || !b.end) {
		return true;
	}
	try {
		const startA = dateToDayjs(a.start);
		const endA = dateToDayjs(a.end);
		const startB = dateToDayjs(b.start);
		const endB = dateToDayjs(b.end);

		return (
			(startA.isBefore(endB) || startA.isSame(endB)) &&
			(startB.isBefore(endA) || startB.isSame(endA))
		);
	} catch {
		return true;
	}
};
export const timeToDayjs = (time: string) => {
	return dayjs(time, 'HH:mm');
};

export const getMonday = (date: dayjs.Dayjs) => {
	return date.isoWeekday(1);
};

export const getTermMonths = (termAlias: string): number[] => {
	switch (termAlias) {
		case 'sem1':
			return [2, 3, 4, 5, 6, 7];
		case 'sem2':
			return [7, 8, 9, 10, 11, 12];
		case 'summer':
			return [12, 1, 2];
		case 'winter':
			return [6, 7];
		case 'term1':
			return [1, 2, 3];
		case 'term2':
			return [4, 5, 6];
		case 'term3':
			return [7, 8, 9];
		case 'term4':
			return [10, 11, 12];
		case 'online1':
			return [1, 2];
		case 'online2':
			return [3, 4];
		case 'online3':
			return [5, 6];
		case 'online4':
			return [7, 8];
		case 'uao1':
			return [1, 2];
		case 'uao2':
			return [3, 4];
		case 'uao3':
			return [5, 6];
		case 'uao4':
			return [7, 8];
		case 'uao5':
			return [9, 10];
		case 'uao6':
			return [11, 12];
		default:
			return [];
	}
};

export const isMeetingInTerm = (
	meetingDateRange: { start: string; end: string },
	termAlias: string,
): boolean => {
	const allowedMonths = getTermMonths(termAlias);
	if (allowedMonths.length === 0) return true;
	try {
		const startMonth = dateToDayjs(meetingDateRange.start).month() + 1;
		const endMonth = dateToDayjs(meetingDateRange.end).month() + 1;
		if (startMonth <= endMonth) {
			for (let m = startMonth; m <= endMonth; m++) {
				if (allowedMonths.includes(m)) return true;
			}
		} else {
			for (let m = startMonth; m <= 12; m++) {
				if (allowedMonths.includes(m)) return true;
			}
			for (let m = 1; m <= endMonth; m++) {
				if (allowedMonths.includes(m)) return true;
			}
		}
		return false;
	} catch {
		return true;
	}
};
