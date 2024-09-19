import { useQueries, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { getCourse } from '../apis';
import type { Course } from '../types/course';
import { useEnrolledCourses } from './enrolled-courses';

export const useGetCourseInfo = (id: string) => {
	const queryClient = useQueryClient();
	const [course, setCourse] = useState<Course | null>(null);

	useEffect(() => {
		const data = queryClient.getQueryData<Course>(['course', id]);
		setCourse(data ?? null);
	}, [id, queryClient]);

	return course;
};

export const useCoursesInfo = () => {
	const courses = useEnrolledCourses((c) => c.courses);
	const coursesIds = courses.map((course) => course.id);
	const data = useQueries({
		queries: coursesIds.map((id) => ({
			queryKey: ['course', id],
			queryFn: () => getCourse({ id }),
		})),
	});
	return data.map((d) => d.data).filter(Boolean) as Course[];
};
