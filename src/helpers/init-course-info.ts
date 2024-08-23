import { useQueries } from '@tanstack/react-query';

import { getCourse } from '../apis';
import { useEnrolledCourses } from '../data/enrolled-courses';

export const useInitCourseInfo = () => {
	const courses = useEnrolledCourses((c) => c.courses);
	const coursesIds = courses.map((course) => course.id);
	useQueries({
		queries: coursesIds.map((id) => ({
			queryKey: ['course', id],
			queryFn: () => getCourse({ id }),
		})),
	});
};
