import { create } from 'zustand';

import type { DetailedEnrolledCourse } from '../types/course';

type SharedTimetableState = {
	sharedTimetableData: DetailedEnrolledCourse[] | null;
	setSharedTimetableData: (value: DetailedEnrolledCourse[] | null) => void;
	showSharedTimetable: boolean;
	setShowSharedTimetable: (value: boolean) => void;
	sharedTimetableAvailable: boolean;
	setSharedTimetableAvailable: (value: boolean) => void;
};

export const useSharedTimetable = create<SharedTimetableState>((set) => ({
	sharedTimetableData: null,
	setSharedTimetableData: (data) => set({ sharedTimetableData: data }),
	showSharedTimetable: false,
	setShowSharedTimetable: (data: boolean) => set({ showSharedTimetable: data }),
	sharedTimetableAvailable: false,
	setSharedTimetableAvailable: (data: boolean) =>
		set({ sharedTimetableAvailable: data }),
}));
