import { create } from 'zustand';
import { mutative } from 'zustand-mutative';
import { persist } from 'zustand/middleware';

import { getCourse } from '../apis';
import { queryClient } from '../lib/query';

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
	removeCourse: (courseId: string) => void;
};

export const useEnrolledCourses = create<CoursesState>()(
	persist(
		mutative((set) => ({
			courses: [],
			addCourse: async (course) => {
				// Add course to state
				set((state) => {
					state.courses.push({ ...course, classes: [] });
				});
				// Fetch course data
				const data = await queryClient.ensureQueryData({
					queryKey: ['course', course.id] as const,
					queryFn: ({ queryKey }) => getCourse({ id: queryKey[1] }),
				});
				// Initialize course classes to default
				set((state) => {
					const enrolledCourse = state.courses.find((c) => c.id === course.id);
					if (!enrolledCourse) return;
					enrolledCourse.classes = data.class_list.map((c) => ({
						id: c.id,
						classNumber: c.classes[0].number,
					}));
				});
			},
			removeCourse: (courseId) => {
				set((state) => {
					state.courses = state.courses.filter((c) => c.id !== courseId);
				});
			},
		})),
		{ name: 'enrolled-courses', version: 0 },
	),
);
