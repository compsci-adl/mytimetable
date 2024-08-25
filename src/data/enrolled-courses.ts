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
	updateCourseClass: (props: {
		courseId: string;
		classTypeId: string;
		classNumber: string;
	}) => void;
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
			updateCourseClass: ({ courseId, classTypeId, classNumber }) => {
				set((state) => {
					const course = state.courses.find((c) => c.id === courseId);
					if (!course) return;
					const classType = course.classes.find((c) => c.id === classTypeId);
					if (!classType) return;
					classType.classNumber = classNumber;
				});
			},
		})),
		{ name: 'enrolled-courses', version: 0 },
	),
);

export const useEnrolledCourse = (id: string) => {
	const course = useEnrolledCourses((s) => s.courses.find((c) => c.id === id));
	const updateCourseClass = useEnrolledCourses((s) => s.updateCourseClass);
	const updateClass = (props: { classTypeId: string; classNumber: string }) => {
		updateCourseClass({ courseId: id, ...props });
	};
	return { course, updateClass };
};
