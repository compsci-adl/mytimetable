import { toast } from 'sonner';
import { create } from 'zustand';
import { mutative } from 'zustand-mutative';
import { persist } from 'zustand/middleware';

import { getCourse } from '../apis';
import { COURSE_COLORS, NOT_FOUND_COLOR } from '../constants/course-colors';
import { LocalStorageKey } from '../constants/local-storage-keys';
import i18n from '../i18n';
import { queryClient } from '../lib/query';
import type { DetailedEnrolledCourse, Meetings } from '../types/course';
import { dateToDayjs } from '../utils/date';
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
	addCourse: (course: Omit<Course, 'classes' | 'color'>) => void;
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
					toast.error(i18n.t('toast.too-many-courses'));
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
				// Initialise course classes to default, preferring classes that
				// have meetings overlapping the currently selected term
				set((state) => {
					const enrolledCourse = state.courses.find((c) => c.id === course.id);
					if (!enrolledCourse) return;

					const selectedTerm =
						localStorage.getItem(LocalStorageKey.Term) ?? 'sem1';

					const termMonthRange = (term: string): [number, number] | null => {
						if (term.startsWith('sem')) {
							const n = Number(term.replace('sem', ''));
							if (n === 1) return [2, 6];
							if (n === 2) return [7, 10];
						}
						return null;
					};

					const monthRange = termMonthRange(selectedTerm);

					enrolledCourse.classes = data.class_list.map((c) => {
						const pick = () => {
							if (!monthRange) return c.classes[0];
							const [startMonth, endMonth] = monthRange;
							// Find a class whose meetings have a start month in the term range
							const found = c.classes.find((cls) =>
								cls.meetings.some((m: Meetings[number]) => {
									try {
										const d = dateToDayjs(m.date.start);
										const month = d.month() + 1; // dayjs months are 0-based
										return month >= startMonth && month <= endMonth;
									} catch {
										return false;
									}
								}),
							);
							return found ?? c.classes[0];
						};

						const chosen = pick();
						return {
							id: c.id,
							classNumber: chosen.number,
						};
					});
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

export const useEnrolledCourseClassNumber = (
	courseId: string,
	classTypeId: string,
) => {
	const course = useEnrolledCourses((s) =>
		s.courses.find((c) => c.id === courseId),
	);
	const classType = course?.classes.find((c) => c.id === classTypeId);
	return classType?.classNumber;
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
			classes: course.classes.map((cls) => {
				const notFound = {
					typeId: cls.id,
					type: 'NOT_FOUND',
					classNumber: '66666',
					meetings: [],
					size: '',
					available_seats: '',
				};
				const classInfo = courseInfo.class_list.find((c) => c.id === cls.id);
				if (!classInfo) return notFound;
				const { type, classes } = classInfo;
				const found = classes.find((c) => c.number === cls.classNumber);
				const meetings = found?.meetings;
				if (!meetings) return notFound;
				return {
					typeId: cls.id,
					type,
					classNumber: cls.classNumber,
					meetings,
					size: found.size,
					available_seats: found.available_seats,
				};
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
