import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { LocalStorageKey } from '../constants/local-storage-keys';

export const MIN_HOUR_HEIGHT = 3;
export const MAX_HOUR_HEIGHT = 10;
export const useCalendarHourHeight = create<{
	height: number;
	setHeight: (getNewHeight: (height: number) => number) => void;
}>()(
	persist(
		(set) => ({
			height: 4.5,
			setHeight: (getNewHeight) =>
				set((state) => {
					const height = getNewHeight(state.height);
					return {
						height: Math.min(
							Math.max(height, MIN_HOUR_HEIGHT),
							MAX_HOUR_HEIGHT,
						),
					};
				}),
		}),
		{ name: LocalStorageKey.CalendarHeight },
	),
);
