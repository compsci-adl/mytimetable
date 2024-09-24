import { toast } from 'sonner';
import { create } from 'zustand';
import { mutative } from 'zustand-mutative';
import { persist } from 'zustand/middleware';

import { getCourse } from '../apis';
import { COURSE_COLORS, NOT_FOUND_COLOR } from '../constants/course-colors';
import { LocalStorageKey } from '../constants/local-storage-keys';
import { queryClient } from '../lib/query';
import type { DetailedEnrolledCourse } from '../types/course';
import { useCoursesInfo } from './course-info';

type Course = {
	id: string;
	name: string;
	classes: Array<{
		id: string; // Class type (Lecture / Workshop / etc.) ID
		classNumber: string; // Meeting time number (ID)
	}>;
	color: number; // Color index in COURSE_COLORS
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
		mutative((set, get) => ({
			courses: [],
			addCourse: async (course) => {
				// Limit to 7 courses
				const currentCourses = get().courses;
				if (currentCourses.length >= 7) {
					toast.error('8 courses for a term is crazy! 💀');
					return currentCourses;
				}
				// Generate a color index
				let color = 0;
				if (currentCourses.length > 0) {
					const maxColor = Math.max(...currentCourses.map((c) => c.color));
					color = (maxColor + 1) % COURSE_COLORS.length;
				}
				// Add course to state
				set((state) => {
					state.courses.push({ ...course, classes: [], color });
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
		{ name: LocalStorageKey.EnrolledCourses, version: 0 },
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

export const useDetailedEnrolledCourses = (): Array<DetailedEnrolledCourse> => {
	const coursesInfo = useCoursesInfo();

	const courses = useEnrolledCourses((s) => s.courses);
	const detailedCourses = courses.map((course) => {
		const courseInfo = coursesInfo.find((c) => c.id === course.id);
		if (!courseInfo) return null;
		return {
			...course,
			name: courseInfo.name,
			classes: course.classes.map((cl) => {
				const notFound = {
					typeId: cl.id,
					type: 'NOT_FOUND',
					classNumber: '66666',
					meetings: [],
				};
				const classInfo = courseInfo.class_list.find((c) => c.id === cl.id);
				if (!classInfo) return notFound;
				const { type, classes } = classInfo;
				const meetings = classes.find(
					(c) => c.number === cl.classNumber,
				)?.meetings;
				if (!meetings) return notFound;
				return { typeId: cl.id, type, classNumber: cl.classNumber, meetings };
			}),
		};
	});

	return detailedCourses.filter((c) => c !== null);
};

export const useCourseColor = (id: string) => {
	const colorIndex = useEnrolledCourses(
		(s) => s.courses.find((c) => c.id === id)?.color,
	);
	if (colorIndex === undefined) return NOT_FOUND_COLOR;
	return COURSE_COLORS[colorIndex];
};
