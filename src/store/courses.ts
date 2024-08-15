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
	addCourse: (course: Omit<Course, 'classes'>) => void;
	addClasses: (params: {
		id: string;
		classes: Array<{ id: string; classNumber: string }>;
	}) => void;
	removeCourse: (courseId: string) => void;
};

export const useCourses = create<CoursesState>()(
	persist(
		mutative((set) => ({
			courses: [],
			addCourse: (course) => {
				set((state) => {
					state.courses.push({ ...course, classes: [] });
				});
			},
			addClasses: ({ id, classes }) => {
				set((state) => {
					const course = state.courses.find((c) => c.id === id);
					if (!course) return;
					course.classes = classes;
				});
			},
			removeCourse: (courseId) => {
				set((state) => {
					state.courses = state.courses.filter((c) => c.id !== courseId);
				});
			},
		})),
		{ name: 'enrolled-courses' },
	),
);
