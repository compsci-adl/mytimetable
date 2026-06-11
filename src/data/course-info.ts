import { useQueries, useQuery } from '@tanstack/react-query';

import { getCourse } from '../apis';
import type { Course } from '../types/course';
import { useEnrolledCourses } from './enrolled-courses';

export const useGetCourseInfo = (id: string) => {
	const { data } = useQuery({
		queryKey: ['course', id],
		queryFn: () => getCourse({ id }),
		staleTime: Infinity,
	});

	return data ?? null;
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
