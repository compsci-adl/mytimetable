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

export type SubjectsRes = Array<string | { code: string; name: string }>;

export const getSubjects = async (params: { year: number; term: string }) => {
	// Fetch the endpoint and normalise the response to return an array.
	const res = await fetcher
		.get<unknown>('subjects', { searchParams: params })
		.json();
	return res as SubjectsRes;
};
