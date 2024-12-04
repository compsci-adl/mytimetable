import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useDetailedEnrolledCourses } from '../data/enrolled-courses';

export const useExportCalendar = () => {
	const { t } = useTranslation();

	const enrolledCourses = useDetailedEnrolledCourses();
	const copyText = async () => {
		const res = enrolledCourses.map((c) => ({
			name: c.name.title + '\n' + c.name.subject + ' ' + c.name.code,
			classes: c.classes
				.map(({ type, classNumber }) => type + ': ' + classNumber)
				.join('\n'),
		}));
		const resStr = res.map((d) => d.name + '\n\n' + d.classes).join('\n\n');
		const advertisement =
			'Planned with MyTimetable\nhttps://mytimetable.csclub.org.au/';
		await navigator.clipboard.writeText(resStr + '\n\n\n' + advertisement);
		toast.success(t('calendar.end-actions.copy-success'));
	};
	return { copyText };
};
