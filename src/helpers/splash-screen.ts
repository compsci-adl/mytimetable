import { create } from 'zustand';

import { LocalStorageKey } from '../constants/local-storage-keys';

type SplashScreenState = {
	showSplash: boolean;
	openSplash: () => void;
	closeSplash: () => void;
};

export const useSplashScreen = create<SplashScreenState>()((set) => {
	let isFirstTime = true;
	try {
		isFirstTime = localStorage.getItem(LocalStorageKey.FirstTime) === null;
	} catch (e) {
		/* v8 ignore start */
		// eslint-disable-next-line no-console
		console.error('Failed to read FirstTime from localStorage:', e);
		/* v8 ignore stop */
	}

	return {
		showSplash: isFirstTime,
		openSplash: () => set({ showSplash: true }),
		closeSplash: () => {
			try {
				localStorage.setItem(LocalStorageKey.FirstTime, 'false');
			} catch (e) {
				/* v8 ignore start */
				// eslint-disable-next-line no-console
				console.error('Failed to write FirstTime to localStorage:', e);
				/* v8 ignore stop */
			}
			set({ showSplash: false });
		},
	};
});
