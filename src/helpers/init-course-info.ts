import { useQueries } from '@tanstack/react-query';

import { getCourse } from '../apis';
import { useEnrolledCourses } from '../data/enrolled-courses';
import { useMount } from '../utils/mount';

export const useInitCourseInfo = () => {
	const courses = useEnrolledCourses((c) => c.courses);
	const coursesIds = courses.map((course) => course.id);
	const queries = useQueries({
		queries: coursesIds.map((id) => ({
			queryKey: ['course', id],
			queryFn: () => getCourse({ id }),
			enabled: false,
		})),
	});
	useMount(() => {
		queries.forEach((q) => q.refetch());
	});
};
