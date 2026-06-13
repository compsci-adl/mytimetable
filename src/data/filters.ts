import { create as produce } from 'mutative';
import { create } from 'zustand';

import { LocalStorageKey } from '../constants/local-storage-keys';

type FiltersState = {
	term: string;
	campuses: string[] | undefined;
	setTerm: (term: string) => void;
	setCampuses: (campuses: string[] | undefined) => void;
};

export const useFilters = create<FiltersState>()((set) => {
	// Initialisefrom localStorage safely
	let initialTerm = 'sem1';
	try {
		const storedTerm = localStorage.getItem(LocalStorageKey.Term);
		if (storedTerm) {
			initialTerm = storedTerm;
		}
	} catch (e) {
		/* v8 ignore start */
		// eslint-disable-next-line no-console
		console.error('Failed to read term from localStorage:', e);
		/* v8 ignore stop */
	}

	let initialCampuses: string[] | undefined = undefined;
	try {
		const storedCampuses = localStorage.getItem(LocalStorageKey.Campuses);
		if (storedCampuses && storedCampuses !== 'undefined') {
			initialCampuses = JSON.parse(storedCampuses);
		}
	} catch (e) {
		/* v8 ignore start */
		// eslint-disable-next-line no-console
		console.error('Failed to read campuses from localStorage:', e);
		/* v8 ignore stop */
	}

	return {
		term: initialTerm,
		campuses: initialCampuses,
		setTerm: (term) => {
			set(
				produce((state) => {
					state.term = term;
				}),
			);
			try {
				localStorage.setItem(LocalStorageKey.Term, term);
			} catch (e) {
				/* v8 ignore start */
				// eslint-disable-next-line no-console
				console.error('Failed to save term to localStorage:', e);
				/* v8 ignore stop */
			}
		},
		setCampuses: (campuses) => {
			set(
				produce((state) => {
					state.campuses = campuses;
				}),
			);
			try {
				if (campuses === undefined) {
					localStorage.removeItem(LocalStorageKey.Campuses);
				} else {
					localStorage.setItem(
						LocalStorageKey.Campuses,
						JSON.stringify(campuses),
					);
				}
			} catch (e) {
				/* v8 ignore start */
				// eslint-disable-next-line no-console
				console.error('Failed to save campuses to localStorage:', e);
				/* v8 ignore stop */
			}
		},
	};
});
