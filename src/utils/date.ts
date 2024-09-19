import { YEAR } from '../constants';
import dayjs from '../lib/dayjs';

export const dateToDayjs = (date: string) => {
	return dayjs(date, 'MM-DD').year(YEAR);
};
export const timeToDayjs = (time: string) => {
	return dayjs(time, 'HH:mm');
};

export const getMonday = (date: dayjs.Dayjs) => {
	return date.isoWeekday(1);
};
