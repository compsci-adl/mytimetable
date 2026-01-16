import { http, HttpResponse } from 'msw';

import adds from './data/adds/adds-res.json';
import gccs from './data/gccs/gccs-res.json';
import mfds from './data/mfds/mfds-res.json';

// Use tanstack query devtools instead of hardcoding loading times
// const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const enum CourseId {
	ADDS = '8b8afe1b-449b-4cce-b108-8dd8eef4648e',
	GCCS = '35dcf831-4888-475a-a172-7842ae3c526e',
	MFDS = '33254151-e980-4727-882c-4bece847fdab',
	ERROR1 = 'bde0f6b8-9bf8-4f47-a895-2b2cc8fc8a44',
	ERROR2 = '4fc2355a-266f-45b6-937c-f91762e22c9a',
	ERROR3 = '0e991105-9c36-495e-b8c2-4fac3a3c7510',
	ERROR4 = 'fd71215c-75c0-4690-982e-263cbbf13f8a',
	ERROR5 = '28c72dfb-1777-4ed1-99a4-eec5c86005f4',
}

const COURSES = [
	{
		id: CourseId.ADDS,
		name: {
			subject: 'COMP SCI',
			code: '2103',
			title: 'Algorithm Design & Data Structures',
		},
	},
	{
		id: CourseId.GCCS,
		name: {
			subject: 'COMP SCI',
			code: '1104',
			title: 'Grand Challenges in Computer Science',
		},
	},
	{
		id: CourseId.MFDS,
		name: {
			subject: 'MATHS',
			code: '1004',
			title: 'Mathematics for Data Science I',
		},
	},
	{
		id: CourseId.ERROR1,
		name: {
			subject: 'ERROR',
			code: '2333',
			title: 'Web & Database Computing',
		},
	},
	{
		id: CourseId.ERROR2,
		name: {
			subject: 'ERROR',
			code: '1145',
			title: 'Web & Database Computing II',
		},
	},
	{
		id: CourseId.ERROR3,
		name: {
			subject: 'ERROR',
			code: '1419',
			title: 'Web & Database Computing III',
		},
	},
	{
		id: CourseId.ERROR4,
		name: {
			subject: 'ERROR',
			code: '1981',
			title: 'Web & Database Computing IV',
		},
	},
	{
		id: CourseId.ERROR5,
		name: {
			subject: 'ERROR',
			code: '0000',
			title: 'Web & Database Computing V',
		},
	},
] as const;

type SubjectCodes = (typeof COURSES)[number]['name']['subject'];
const availableSubjects: Array<{ code: SubjectCodes; name: string }> = [
	{ code: 'COMP SCI', name: 'Computer Science' },
	{ code: 'MATHS', name: 'Mathematics' },
	{ code: 'ERROR', name: 'Error' },
];
const subjects = [
	...availableSubjects,
	// Long subject
	{ code: 'PETROGEO', name: 'Petroleum Geology & Geophysics' },
];

export const handlers = [
	http.get('/mock/subjects', async () => {
		return HttpResponse.json(subjects);
	}),
	http.get('/mock/courses', async ({ request }) => {
		const url = new URL(request.url);
		const subject = url.searchParams.get('subject');
		return HttpResponse.json({
			courses: COURSES.filter((c) => c.name.subject === subject),
		});
	}),
	http.get('/mock/courses/:id', async ({ params }) => {
		const { id } = params as { id: CourseId };
		if (id !== CourseId.ADDS && id !== CourseId.GCCS && id !== CourseId.MFDS)
			return HttpResponse.json({ error: 'Course not found' }, { status: 404 });
		const idResMap = {
			[CourseId.ADDS]: adds,
			[CourseId.GCCS]: gccs,
			[CourseId.MFDS]: mfds,
		};
		return HttpResponse.json(idResMap[id]);
	}),
];
