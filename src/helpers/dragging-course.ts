import { create } from 'zustand';

import type { WeekCourse } from '../types/course';

export type DraggingCourseState = {
	isDragging: boolean;
	course: WeekCourse | null;
	start: (course: WeekCourse) => void;
	stop: () => void;
};

export const useDraggingCourse = create<DraggingCourseState>()((set) => ({
	isDragging: false,
	course: null,
	start: (course) => set({ isDragging: true, course }),
	stop: () => set({ isDragging: false, course: null }),
}));
