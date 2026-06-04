import { describe, it, expect, vi } from 'vitest';

import { getCourses, getCourse, getSubjects } from '../../src/apis';
import { fetcher } from '../../src/apis/fetcher';

// Mock fetcher
vi.mock('../../src/apis/fetcher', () => ({
	fetcher: {
		get: vi.fn().mockReturnValue({
			json: vi.fn(),
		}),
	},
}));

describe('API functions in src/apis/index.ts', () => {
	it('should call fetcher.get with correct arguments for getCourses', async () => {
		const mockData = { courses: [] };
		const mockJson = vi.fn().mockResolvedValue(mockData);
		vi.mocked(fetcher.get).mockReturnValue({
			json: mockJson,
		} as unknown as ReturnType<typeof fetcher.get>);

		const params = { year: 2024, term: 'sem1', subject: 'COMP SCI' };
		const result = await getCourses(params);

		expect(fetcher.get).toHaveBeenCalledWith('courses', {
			searchParams: params,
		});
		expect(result).toEqual(mockData);
	});

	it('should call fetcher.get with correct arguments for getCourse', async () => {
		const mockData = { id: 'adds' };
		const mockJson = vi.fn().mockResolvedValue(mockData);
		vi.mocked(fetcher.get).mockReturnValue({
			json: mockJson,
		} as unknown as ReturnType<typeof fetcher.get>);

		const result = await getCourse({ id: 'adds' });

		expect(fetcher.get).toHaveBeenCalledWith('courses/adds');
		expect(result).toEqual(mockData);
	});

	it('should call fetcher.get with correct arguments for getSubjects', async () => {
		const mockData = ['COMP SCI', 'MATHS'];
		const mockJson = vi.fn().mockResolvedValue(mockData);
		vi.mocked(fetcher.get).mockReturnValue({
			json: mockJson,
		} as unknown as ReturnType<typeof fetcher.get>);

		const params = { year: 2024, term: 'sem1' };
		const result = await getSubjects(params);

		expect(fetcher.get).toHaveBeenCalledWith('subjects', {
			searchParams: params,
		});
		expect(result).toEqual(mockData);
	});
});
