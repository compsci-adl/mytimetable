import { create } from 'zustand';

import { LocalStorageKey } from '../constants/local-storage-keys';

type DarkModeState = {
	isDarkMode: boolean;
	toggleIsDarkMode: () => void;
	initDarkMode: () => void;
};

const getInitialDarkMode = (): boolean => {
	try {
		const stored = localStorage.getItem(LocalStorageKey.DarkMode);
		if (stored === 'dark') return true;
		if (stored === 'light') return false;
	} catch (e) {
		// eslint-disable-next-line no-console
		console.error('Failed to read DarkMode from localStorage:', e);
	}
	return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const updateDOM = (isDark: boolean) => {
	if (isDark) {
		document.documentElement.classList.add('dark');
		document.documentElement.setAttribute('data-theme', 'dark');
	} else {
		document.documentElement.classList.remove('dark');
		document.documentElement.removeAttribute('data-theme');
	}
};

export const useDarkMode = create<DarkModeState>()((set) => {
	// Initialiseimmediately for the hook
	const initial = getInitialDarkMode();
	updateDOM(initial);

	return {
		isDarkMode: initial,
		toggleIsDarkMode: () =>
			set((state) => {
				const next = !state.isDarkMode;
				try {
					localStorage.setItem(
						LocalStorageKey.DarkMode,
						next ? 'dark' : 'light',
					);
				} catch (e) {
					// eslint-disable-next-line no-console
					console.error('Failed to write DarkMode to localStorage:', e);
				}
				updateDOM(next);
				return { isDarkMode: next };
			}),
		initDarkMode: () => {
			// Listen for system changes if there is no manual preference
			const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			const handleChange = () => {
				try {
					const hasManualPref =
						localStorage.getItem(LocalStorageKey.DarkMode) !== null;
					if (!hasManualPref) {
						const next = mediaQuery.matches;
						updateDOM(next);
						set({ isDarkMode: next });
					}
				} catch {
					const next = mediaQuery.matches;
					updateDOM(next);
					set({ isDarkMode: next });
				}
			};
			mediaQuery.addEventListener('change', handleChange);
		},
	};
});
