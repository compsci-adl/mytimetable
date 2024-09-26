import type { Course } from '../types/course';
import { fetcher } from './fetcher';

type CoursesRes = {
	courses: Array<{
		id: string;
		name: {
			subject: string;
			code: string;
			title: string;
		};
	}>;
};

export const getCourses = async (params: {
	year: number;
	term: string;
	subject: string;
}) => {
	return fetcher.get<CoursesRes>('courses', { searchParams: params }).json();
};

export const getCourse = async ({ id }: { id: string }) => {
	return fetcher.get<Course>(`courses/${id}`).json();
};

type SubjectsRes = {
	subjects: Array<{ code: string; name: string }>;
};

export const getSubjects = async () => {
	return fetcher.get<SubjectsRes>('subjects').json();
};
