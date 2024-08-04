import { http, HttpResponse } from 'msw';

import adds from './data/adds/adds-res.json';
import gccs from './data/gccs/gccs-res.json';
import mfds from './data/mfds/mfds-res.json';

export const handlers = [
	http.get('/api/courses', () => {
		return HttpResponse.json({
			courses: [
				{ id: '107592', name: 'COMP SCI 2103' },
				{ id: '106541', name: 'COMP SCI 1104' },
				{ id: '109685', name: 'MATHS 1004' },
			],
		});
	}),
	http.get('/api/course/:id', ({ params }) => {
		const { id } = params;
		const idResMap = { '107592': adds, '106541': gccs, '109685': mfds };
		return HttpResponse.json(idResMap[id as keyof typeof idResMap]);
	}),
];
