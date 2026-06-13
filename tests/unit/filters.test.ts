import { describe, it, expect, vi, beforeEach } from 'vitest';

const localStorageStore: Record<string, string> = {};
const localStorageMock = {
	getItem: vi.fn((key: string) => localStorageStore[key] || null),
	setItem: vi.fn((key: string, value: string) => {
		localStorageStore[key] = String(value);
	}),
	removeItem: vi.fn((key: string) => {
		delete localStorageStore[key];
	}),
	clear: () => {
		Object.keys(localStorageStore).forEach((key) => {
			delete localStorageStore[key];
		});
	},
};

Object.defineProperty(globalThis, 'localStorage', {
	value: localStorageMock,
	writable: true,
});

describe('useFilters Zustand Store', () => {
	beforeEach(() => {
		localStorageMock.clear();
		vi.clearAllMocks();
		vi.resetModules();
	});

	it('should Initialisewith default values when localStorage is empty', async () => {
		const { useFilters } = await import('../../src/data/filters');
		expect(useFilters.getState().term).toBe('sem1');
		expect(useFilters.getState().campuses).toBeUndefined();
	});

	it('should Initialisewith values from localStorage if present', async () => {
		localStorageMock.setItem('MTT.term', 'sem2');
		localStorageMock.setItem(
			'MTT.campuses',
			JSON.stringify(['City East', 'North Terrace']),
		);

		const { useFilters } = await import('../../src/data/filters');
		expect(useFilters.getState().term).toBe('sem2');
		expect(useFilters.getState().campuses).toEqual([
			'City East',
			'North Terrace',
		]);
	});

	it('should handle malformed json in localStorage campuses gracefully', async () => {
		localStorageMock.setItem('MTT.term', 'sem1');
		localStorageMock.setItem('MTT.campuses', 'invalid-json{[');

		const { useFilters } = await import('../../src/data/filters');
		expect(useFilters.getState().term).toBe('sem1');
		expect(useFilters.getState().campuses).toBeUndefined();
	});

	it('should handle localStorage.getItem throwing an error during initialization', async () => {
		localStorageMock.getItem.mockImplementationOnce(() => {
			throw new Error('Storage disabled');
		});
		localStorageMock.getItem.mockImplementationOnce(() => {
			throw new Error('Storage disabled');
		});

		const { useFilters } = await import('../../src/data/filters');
		expect(useFilters.getState().term).toBe('sem1');
		expect(useFilters.getState().campuses).toBeUndefined();
	});

	it('should set term and persist to localStorage', async () => {
		const { useFilters } = await import('../../src/data/filters');
		useFilters.getState().setTerm('sem3');
		expect(useFilters.getState().term).toBe('sem3');
		expect(localStorageMock.getItem('MTT.term')).toBe('sem3');
	});

	it('should handle localStorage.setItem throwing an error when setting term', async () => {
		localStorageMock.setItem.mockImplementationOnce(() => {
			throw new Error('Write failed');
		});

		const { useFilters } = await import('../../src/data/filters');
		useFilters.getState().setTerm('sem3');
		expect(useFilters.getState().term).toBe('sem3');
	});

	it('should set campuses and persist to localStorage', async () => {
		const { useFilters } = await import('../../src/data/filters');
		useFilters.getState().setCampuses(['Roseworthy']);
		expect(useFilters.getState().campuses).toEqual(['Roseworthy']);
		expect(JSON.parse(localStorageMock.getItem('MTT.campuses')!)).toEqual([
			'Roseworthy',
		]);

		useFilters.getState().setCampuses(undefined);
		expect(useFilters.getState().campuses).toBeUndefined();
		expect(localStorageMock.getItem('MTT.campuses')).toBeNull();
	});

	it('should handle localStorage throwing an error when setting campuses', async () => {
		localStorageMock.setItem.mockImplementationOnce(() => {
			throw new Error('Write failed');
		});
		localStorageMock.removeItem.mockImplementationOnce(() => {
			throw new Error('Remove failed');
		});

		const { useFilters } = await import('../../src/data/filters');
		useFilters.getState().setCampuses(['Roseworthy']);
		expect(useFilters.getState().campuses).toEqual(['Roseworthy']);

		useFilters.getState().setCampuses(undefined);
		expect(useFilters.getState().campuses).toBeUndefined();
	});
});
