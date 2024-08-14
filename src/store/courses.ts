import { create } from 'zustand';
import { mutative } from 'zustand-mutative';
import { persist } from 'zustand/middleware';

type Course = {
	id: string;
	name: string;
	classes: Array<{
		id: string; // Class type (Lecture / Workshop / etc.) ID
		classNumber: string; // Meeting time number (ID)
	}>;
};
type Courses = Array<Course>;
type CoursesState = {
	courses: Courses;
	addCourse: (course: Course) => void;
	removeCourse: (courseId: string) => void;
};

export const useCourses = create<CoursesState>()(
	persist(
		mutative((set) => ({
			courses: [],
			addCourse: (course) =>
				set((state) => {
					state.courses.push(course);
				}),
			removeCourse: (courseId) => {
				set((state) => {
					state.courses = state.courses.filter((c) => c.id !== courseId);
				});
			},
		})),
		{ name: 'enrolled-courses' },
	),
);
