import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import type { getCourse } from '../apis';
import type { Course } from '../types/course';

export const useCourseInfo = (id: string) => {
	const queryClient = useQueryClient();
	const [course, setCourse] = useState<Course | null>(null);

	useEffect(() => {
		const data = queryClient.getQueryData<
			Awaited<ReturnType<typeof getCourse>>
		>(['course', id]);
		setCourse(data ?? null);
	}, [id, queryClient]);

	return course;
};
