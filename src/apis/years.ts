import { fetcher } from './fetcher';

export interface YearsResponse {
	active_year: number;
	available_years: number[];
	years_with_classes?: number[];
}

export function getDefaultYears(): YearsResponse {
	const currentYear = new Date().getFullYear();
	return {
		active_year: currentYear,
		available_years: [currentYear, currentYear + 1],
		years_with_classes: [currentYear],
	};
}

export async function fetchAvailableYears(): Promise<YearsResponse> {
	try {
		return await fetcher.get('years').json<YearsResponse>();
	} catch (error) {
		// eslint-disable-next-line no-console
		console.warn('Failed to fetch academic years, using fallback:', error);
		return getDefaultYears();
	}
}
