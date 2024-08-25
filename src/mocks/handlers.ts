import { http, HttpResponse } from 'msw';

import adds from './data/adds/adds-res.json';
import gccs from './data/gccs/gccs-res.json';
import mfds from './data/mfds/mfds-res.json';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const enum CourseId {
	ADDS = '8b8afe1b-449b-4cce-b108-8dd8eef4648e',
	GCCS = '35dcf831-4888-475a-a172-7842ae3c526e',
	MFDS = '33254151-e980-4727-882c-4bece847fdab',
	ERROR = 'bde0f6b8-9bf8-4f47-a895-2b2cc8fc8a44',
}

export const handlers = [
	http.get('/api/courses', async () => {
		// await wait(2000);
		return HttpResponse.json({
			courses: [
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
					id: CourseId.ERROR,
					name: {
						subject: 'ERROR',
						code: '2333',
						title: 'Web & Database Computing',
					},
				},
			],
		});
	}),
	http.get('/api/course/:id', async ({ params }) => {
		await wait(3000);
		const { id } = params;
		if (id === CourseId.ERROR)
			return HttpResponse.json({ error: 'Course not found' }, { status: 404 });
		const idResMap = {
			[CourseId.ADDS]: adds,
			[CourseId.GCCS]: gccs,
			[CourseId.MFDS]: mfds,
		};
		return HttpResponse.json(idResMap[id as keyof typeof idResMap]);
	}),
];
