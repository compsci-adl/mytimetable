import { useQueries, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { getCourse } from '../apis';
import type { Course } from '../types/course';
import { useEnrolledCourses } from './enrolled-courses';

export const useGetCourseInfo = (id: string) => {
	const queryClient = useQueryClient();
	const [course, setCourse] = useState<Course | null>(
		() => queryClient.getQueryData<Course>(['course', id]) ?? null,
	);

	useEffect(() => {
		const cache = queryClient.getQueryCache();
		const key = ['course', id];
		const unsubscribe = cache.subscribe(
			(e: { query?: { queryKey?: unknown[]; state?: { data?: unknown } } }) => {
				const q = e.query;
				if (!q) return;
				if (JSON.stringify(q.queryKey) !== JSON.stringify(key)) return;
				setCourse((q.state?.data as Course | undefined) ?? null);
			},
		);
		return unsubscribe;
	}, [id, queryClient]);

	return course;
};

export const useGetCourseClasses = (courseId: string, classTypeId: string) => {
	const course = useGetCourseInfo(courseId);
	if (!course) return null;
	const classType = course.class_list.find((c) => c.id === classTypeId);
	if (!classType) return null;
	return classType.classes;
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
