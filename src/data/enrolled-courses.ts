import { create as produce } from 'mutative';
import { toast } from 'sonner';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { getCourse } from '../apis';
import { COURSE_COLORS, NOT_FOUND_COLOR } from '../constants/course-colors';
import { LocalStorageKey } from '../constants/local-storage-keys';
import i18n from '../i18n';
import { queryClient } from '../lib/query';
import type {
	Course as ApiCourse,
	DetailedEnrolledCourse,
	Meetings,
} from '../types/course';
import { isMeetingInTerm } from '../utils/date';
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
	addCourse: (
		course: Omit<Course, 'classes' | 'color'> & {
			preferredCampuses?: string[];
		},
	) => void;
	removeCourse: (courseId: string) => void;
	clearCourses: () => void;
	updateCourseClass: (props: {
		courseId: string;
		classTypeId: string;
		classNumber: string;
	}) => void;
};

export const useEnrolledCourses = create<CoursesState>()(
	persist(
		(set, get) => ({
			courses: [],
			addCourse: async (
				course: Omit<Course, 'classes' | 'color'> & {
					preferredCampuses?: string[];
				},
			) => {
				// Limit to max 10 courses
				const currentCourses = get().courses;
				if (currentCourses.length > 10) {
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
				set(
					produce((state) => {
						state.courses.push({ ...course, classes: [], color });
					}),
				);
				const preferredCampuses = course.preferredCampuses;

				// Fetch course data
				const data = await queryClient.ensureQueryData({
					queryKey: ['course', course.id] as const,
					queryFn: ({ queryKey }) => getCourse({ id: queryKey[1] }),
				});
				// Initialise course classes to default, preferring classes that
				// have meetings overlapping the currently selected term
				set(
					produce((state) => {
						const enrolledCourse = state.courses.find(
							(c) => c.id === course.id,
						);
						if (!enrolledCourse) return;

						const selectedTermAlias =
							localStorage.getItem(LocalStorageKey.Term) ?? 'sem1';

						const uniqueGroups = Array.from(
							new Set(
								data.class_list
									.flatMap((ct) => ct.classes)
									.map((cls) => cls.group)
									.filter(
										(g): g is string =>
											typeof g === 'string' && g.trim() !== '',
									),
							),
						);

						let chosenGroup: string | undefined;
						if (uniqueGroups.length > 1) {
							const firstClassType = data.class_list[0];
							const termClasses = firstClassType.classes.filter((cls) =>
								cls.meetings.some((m) =>
									isMeetingInTerm(m.date, selectedTermAlias),
								),
							);
							const candidates =
								termClasses.length > 0 ? termClasses : firstClassType.classes;
							const foundByCampus =
								preferredCampuses && preferredCampuses.length > 0
									? candidates.find((cls) =>
											cls.meetings.some((m: Meetings[number]) =>
												preferredCampuses.includes(m.campus),
											),
										)
									: undefined;
							const firstChosen = foundByCampus ?? candidates[0];
							chosenGroup = firstChosen?.group ?? uniqueGroups[0];
						}

						enrolledCourse.classes = data.class_list.map((c) => {
							const pick = () => {
								const groupMatchedClasses = chosenGroup
									? c.classes.filter(
											(cls) => !cls.group || cls.group === chosenGroup,
										)
									: c.classes;
								const pool =
									groupMatchedClasses.length > 0
										? groupMatchedClasses
										: c.classes;

								const termClasses = pool.filter((cls) =>
									cls.meetings.some((m) =>
										isMeetingInTerm(m.date, selectedTermAlias),
									),
								);
								const candidates = termClasses.length > 0 ? termClasses : pool;

								if (preferredCampuses && preferredCampuses.length > 0) {
									const foundByCampus = candidates.find((cls) =>
										cls.meetings.some((m: Meetings[number]) =>
											preferredCampuses.includes(m.campus),
										),
									);
									if (foundByCampus) return foundByCampus;
								}

								return candidates[0];
							};

							const chosen = pick();
							return {
								id: c.id,
								classNumber: chosen?.number ?? 'not-available',
							};
						});
					}),
				);
			},
			removeCourse: (courseId) => {
				set(
					produce((state) => {
						state.courses = state.courses.filter((c) => c.id !== courseId);
					}),
				);
			},
			clearCourses: () => {
				set(
					produce((state) => {
						state.courses = [];
					}),
				);
			},
			updateCourseClass: ({ courseId, classTypeId, classNumber }) => {
				const courseData = queryClient.getQueryData<ApiCourse>([
					'course',
					courseId,
				]);
				set(
					produce((state) => {
						const course = state.courses.find((c) => c.id === courseId);
						if (!course) return;
						const classType = course.classes.find((c) => c.id === classTypeId);
						if (!classType) return;
						classType.classNumber = classNumber;

						if (courseData) {
							const targetCt = courseData.class_list.find(
								(ct) => ct.id === classTypeId,
							);
							const targetCls = targetCt?.classes.find(
								(c) => c.number === classNumber,
							);
							const targetGroup = targetCls?.group;

							if (targetGroup) {
								const selectedTermAlias =
									localStorage.getItem(LocalStorageKey.Term) ?? 'sem1';

								courseData.class_list.forEach((ct) => {
									if (ct.id === classTypeId) return;
									const enrolledCls = course.classes.find(
										(c) => c.id === ct.id,
									);
									if (!enrolledCls) return;

									const currentClsInfo = ct.classes.find(
										(c) => c.number === enrolledCls.classNumber,
									);
									if (currentClsInfo?.group === targetGroup) return;

									const groupMatchedClasses = ct.classes.filter(
										(cls) => !cls.group || cls.group === targetGroup,
									);
									const pool =
										groupMatchedClasses.length > 0
											? groupMatchedClasses
											: ct.classes;

									const termClasses = pool.filter((cls) =>
										cls.meetings.some((m) =>
											isMeetingInTerm(m.date, selectedTermAlias),
										),
									);
									const candidates =
										termClasses.length > 0 ? termClasses : pool;

									const chosen = candidates[0];
									if (chosen) {
										enrolledCls.classNumber = chosen.number;
									}
								});
							}
						}
					}),
				);
			},
		}),
		{ name: LocalStorageKey.EnrolledCourses, version: 0 },
	),
);

/* v8 ignore start */
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
					group: found.group,
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
