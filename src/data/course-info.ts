import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import type { Course } from '../types/course';

export const useGetCourseInfo = (id: string) => {
	const queryClient = useQueryClient();
	const [course, setCourse] = useState<Course | null>(null);

	useEffect(() => {
		const data = queryClient.getQueryData<Course>(['course', id]);
		setCourse(data ?? null);
	}, [id, queryClient]);

	return course;
};
