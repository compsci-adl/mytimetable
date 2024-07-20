import { http, HttpResponse } from 'msw';

export const handlers = [
	http.get('/api/courses', () => {
		return HttpResponse.json({
			courses: [{ id: '12345', name: 'COMP SCI 1234' }],
		});
	}),
];
