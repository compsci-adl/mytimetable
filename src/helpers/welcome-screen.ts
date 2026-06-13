import { create } from 'zustand';

import { LocalStorageKey } from '../constants/local-storage-keys';

type WelcomeScreenState = {
	showWelcome: boolean;
	openWelcome: () => void;
	closeWelcome: () => void;
};

export const useWelcomeScreen = create<WelcomeScreenState>()((set) => {
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
		showWelcome: isFirstTime,
		openWelcome: () => set({ showWelcome: true }),
		closeWelcome: () => {
			try {
				localStorage.setItem(LocalStorageKey.FirstTime, 'false');
			} catch (e) {
				/* v8 ignore start */
				// eslint-disable-next-line no-console
				console.error('Failed to write FirstTime to localStorage:', e);
				/* v8 ignore stop */
			}
			set({ showWelcome: false });
		},
	};
});
