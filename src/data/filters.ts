import { create as produce } from 'mutative';
import { create } from 'zustand';

import { fetchAvailableYears, getDefaultYears } from '../apis/years';
import { LocalStorageKey } from '../constants/local-storage-keys';

type FiltersState = {
	year: number;
	availableYears: number[];
	yearsWithClasses: number[];
	isLoadingYears: boolean;
	term: string;
	campuses: string[] | undefined;
	setYear: (year: number) => void;
	setTerm: (term: string) => void;
	setCampuses: (campuses: string[] | undefined) => void;
	initYears: () => Promise<void>;
};

export const useFilters = create<FiltersState>()((set) => {
	// Initialise from localStorage safely
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

	const fallbackYears = getDefaultYears();
	return {
		year: fallbackYears.active_year,
		availableYears: fallbackYears.available_years,
		yearsWithClasses: fallbackYears.years_with_classes,
		isLoadingYears: false,
		term: initialTerm,
		campuses: initialCampuses,
		setYear: (year: number) => {
			set(
				produce((state) => {
					state.year = year;
				}),
			);
			try {
				localStorage.setItem(LocalStorageKey.Year, String(year));
			} catch (e) {
				/* v8 ignore start */
				// eslint-disable-next-line no-console
				console.error('Failed to save year to localStorage:', e);
				/* v8 ignore stop */
			}
		},
		setTerm: (term: string) => {
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
		/* v8 ignore start */
		initYears: async () => {
			set(
				produce((state) => {
					state.isLoadingYears = true;
				}),
			);
			try {
				const data = await fetchAvailableYears();
				const yearsWithClasses = data.years_with_classes ?? [];
				// Determine latest year with classes in db
				const latestYearWithClasses =
					yearsWithClasses.length > 0
						? Math.max(...yearsWithClasses)
						: data.active_year;

				const storedYear = localStorage.getItem(LocalStorageKey.Year);
				const parsedStoredYear = storedYear ? Number(storedYear) : null;

				let activeYear = latestYearWithClasses;
				// If stored preference exists and is among available years, keep it
				if (
					parsedStoredYear &&
					data.available_years.includes(parsedStoredYear)
				) {
					activeYear = parsedStoredYear;
				}

				set(
					produce((state) => {
						state.availableYears = data.available_years;
						state.yearsWithClasses = yearsWithClasses;
						state.year = activeYear;
						state.isLoadingYears = false;
					}),
				);
				try {
					localStorage.setItem(LocalStorageKey.Year, String(activeYear));
				} catch {
					/* ignore */
				}
			} catch (error) {
				// eslint-disable-next-line no-console
				console.error('Failed to init years:', error);
				set(
					produce((state) => {
						state.isLoadingYears = false;
					}),
				);
			}
		},
		/* v8 ignore stop */
	};
});
