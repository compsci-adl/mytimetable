import { http, HttpResponse } from 'msw';

import adds from './data/adds/adds-res.json';
import gccs from './data/gccs/gccs-res.json';
import mfds from './data/mfds/mfds-res.json';

export const handlers = [
	http.get('/api/courses', () => {
		return HttpResponse.json({
			courses: [
				{
					id: '8b8afe1b-449b-4cce-b108-8dd8eef4648e',
					name: {
						subject: 'COMP SCI',
						code: '2103',
						title: 'Algorithm Design & Data Structures',
					},
				},
				{
					id: '35dcf831-4888-475a-a172-7842ae3c526e',
					name: {
						subject: 'COMP SCI',
						code: '1104',
						title: 'Grand Challenges in Computer Science',
					},
				},
				{
					id: '33254151-e980-4727-882c-4bece847fdab',
					name: {
						subject: 'MATHS',
						code: '1004',
						title: 'Mathematics for Data Science I',
					},
				},
			],
		});
	}),
	http.get('/api/course/:id', ({ params }) => {
		const { id } = params;
		const idResMap = {
			'8b8afe1b-449b-4cce-b108-8dd8eef4648e': adds,
			'35dcf831-4888-475a-a172-7842ae3c526e': gccs,
			'33254151-e980-4727-882c-4bece847fdab': mfds,
		};
		return HttpResponse.json(idResMap[id as keyof typeof idResMap]);
	}),
];
