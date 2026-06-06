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

describe('useSplashScreen Zustand Store', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.clearAllMocks();
		vi.resetModules();
	});

	it('should default to true if FirstTime is not set in localStorage', async () => {
		const { useSplashScreen } = await import('../../src/helpers/splash-screen');
		expect(useSplashScreen.getState().showSplash).toBe(true);
	});

	it('should default to false if FirstTime is set to false in localStorage', async () => {
		localStorage.setItem('MTT.first-time', 'false');
		const { useSplashScreen } = await import('../../src/helpers/splash-screen');
		expect(useSplashScreen.getState().showSplash).toBe(false);
	});

	it('should open splash and set showSplash to true', async () => {
		const { useSplashScreen } = await import('../../src/helpers/splash-screen');
		useSplashScreen.getState().openSplash();
		expect(useSplashScreen.getState().showSplash).toBe(true);
	});

	it('should close splash and persist setting to localStorage', async () => {
		const { useSplashScreen } = await import('../../src/helpers/splash-screen');
		useSplashScreen.getState().closeSplash();
		expect(useSplashScreen.getState().showSplash).toBe(false);
		expect(localStorage.getItem('MTT.first-time')).toBe('false');
	});

	it('should handle localStorage reading errors gracefully on initialization', async () => {
		const originalGetItem = localStorage.getItem;
		localStorage.getItem = vi.fn().mockImplementation(() => {
			throw new Error('Read error');
		});

		const { useSplashScreen } = await import('../../src/helpers/splash-screen');
		expect(useSplashScreen.getState().showSplash).toBe(true);

		localStorage.getItem = originalGetItem;
	});

	it('should handle localStorage writing errors gracefully on close', async () => {
		const originalSetItem = localStorage.setItem;
		localStorage.setItem = vi.fn().mockImplementation(() => {
			throw new Error('Write error');
		});

		const { useSplashScreen } = await import('../../src/helpers/splash-screen');
		useSplashScreen.getState().closeSplash();
		expect(useSplashScreen.getState().showSplash).toBe(false);

		localStorage.setItem = originalSetItem;
	});
});
