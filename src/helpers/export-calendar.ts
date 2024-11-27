import { toast } from 'sonner';

import { useDetailedEnrolledCourses } from '../data/enrolled-courses';

export const useExportCalendar = () => {
	const enrolledCourses = useDetailedEnrolledCourses();
	const copy = async () => {
		const res = enrolledCourses.map((c) => ({
			name: c.name.title + '\n' + c.name.subject + ' ' + c.name.code,
			classes: c.classes
				.map(({ type, classNumber }) => type + ': ' + classNumber)
				.join('\n'),
		}));
		const resStr = res.map((d) => d.name + '\n\n' + d.classes).join('\n\n\n');
		await navigator.clipboard.writeText(resStr);
		toast.success('Copied to clipboard!');
	};
	const exportFile = () => {};
	return { copy, exportFile };
};
