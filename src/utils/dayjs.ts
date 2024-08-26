import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

export const dateToDayjs = (date: string) => {
	return dayjs(date, 'MM-DD');
};
export const timeToDayjs = (time: string) => {
	return dayjs(time, 'HH:mm');
};
