import { vi } from 'vitest';
import { describe, it, expect, beforeEach } from 'vitest';

vi.hoisted(() => {
	const localStorageStoreGlobal: Record<string, string> = {};
	const localStorageMockGlobal = {
		getItem: vi.fn((key: string) => localStorageStoreGlobal[key] || null),
		setItem: vi.fn((key: string, value: string) => {
			localStorageStoreGlobal[key] = String(value);
		}),
		removeItem: vi.fn((key: string) => {
			delete localStorageStoreGlobal[key];
		}),
		clear: () => {
			Object.keys(localStorageStoreGlobal).forEach((key) => {
				delete localStorageStoreGlobal[key];
			});
		},
	};
	Object.defineProperty(globalThis, 'localStorage', {
		value: localStorageMockGlobal,
		writable: true,
	});
	if (typeof window !== 'undefined') {
		Object.defineProperty(window, 'localStorage', {
			value: localStorageMockGlobal,
			writable: true,
		});
	}
});

describe('useWelcomeScreen Zustand Store', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.clearAllMocks();
		vi.resetModules();
	});

	it('should default to true if FirstTime is not set in localStorage', async () => {
		const { useWelcomeScreen } =
			await import('../../src/helpers/welcome-screen');
		expect(useWelcomeScreen.getState().showWelcome).toBe(true);
	});

	it('should default to false if FirstTime is set to false in localStorage', async () => {
		localStorage.setItem('MTT.first-time', 'false');
		const { useWelcomeScreen } =
			await import('../../src/helpers/welcome-screen');
		expect(useWelcomeScreen.getState().showWelcome).toBe(false);
	});

	it('should open welcome screen and set showWelcome to true', async () => {
		const { useWelcomeScreen } =
			await import('../../src/helpers/welcome-screen');
		useWelcomeScreen.getState().openWelcome();
		expect(useWelcomeScreen.getState().showWelcome).toBe(true);
	});

	it('should close welcome screen and persist setting to localStorage', async () => {
		const { useWelcomeScreen } =
			await import('../../src/helpers/welcome-screen');
		useWelcomeScreen.getState().closeWelcome();
		expect(useWelcomeScreen.getState().showWelcome).toBe(false);
		expect(localStorage.getItem('MTT.first-time')).toBe('false');
	});

	it('should handle localStorage reading errors gracefully on initialization', async () => {
		const originalGetItem = localStorage.getItem;
		localStorage.getItem = vi.fn().mockImplementation(() => {
			throw new Error('Read error');
		});

		const { useWelcomeScreen } =
			await import('../../src/helpers/welcome-screen');
		expect(useWelcomeScreen.getState().showWelcome).toBe(true);

		localStorage.getItem = originalGetItem;
	});

	it('should handle localStorage writing errors gracefully on close', async () => {
		const originalSetItem = localStorage.setItem;
		localStorage.setItem = vi.fn().mockImplementation(() => {
			throw new Error('Write error');
		});

		const { useWelcomeScreen } =
			await import('../../src/helpers/welcome-screen');
		useWelcomeScreen.getState().closeWelcome();
		expect(useWelcomeScreen.getState().showWelcome).toBe(false);

		localStorage.setItem = originalSetItem;
	});
});
