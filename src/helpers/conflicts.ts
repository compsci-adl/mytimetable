import type { DetailedEnrolledCourse } from '../types/course';
import { timeOverlap } from '../utils/time-overlap';

type ConflictDetail = {
	otherCourseId: string;
	otherCourseCode: string;
	otherClassType: string;
	otherClassNumber: string;
	meeting: {
		day: string;
		time: { start: string; end: string };
		location?: string;
		campus?: string;
	};
	otherMeeting: {
		day: string;
		time: { start: string; end: string };
		location?: string;
		campus?: string;
	};
};

const getClassKey = (
	courseId: string,
	classTypeId: string,
	classNumber: string,
) => `${courseId}|${classTypeId}|${classNumber}`;

export const findConflicts = (courses: DetailedEnrolledCourse[]) => {
	const conflictsByClassKey: Record<string, ConflictDetail[]> = {};
	const conflictsKeySet: Record<string, Set<string>> = {};
	const courseHasConflict: Record<string, boolean> = {};

	for (let i = 0; i < courses.length; i++) {
		const a = courses[i];
		for (const aCls of a.classes) {
			for (const aMeet of aCls.meetings) {
				for (let j = 0; j < courses.length; j++) {
					if (i === j) continue;
					const b = courses[j];
					for (const bCls of b.classes) {
						for (const bMeet of bCls.meetings) {
							// Only consider same day
							if (aMeet.day !== bMeet.day) continue;
							if (timeOverlap(aMeet.time, bMeet.time)) {
								const keyA = getClassKey(a.id, aCls.typeId, aCls.classNumber);
								const detail: ConflictDetail = {
									otherCourseId: b.id,
									otherCourseCode: b.name.code,
									otherClassType: bCls.type,
									otherClassNumber: bCls.classNumber,
									meeting: {
										day: aMeet.day,
										time: aMeet.time,
										location: aMeet.location,
										campus: aMeet.campus,
									},
									otherMeeting: {
										day: bMeet.day,
										time: bMeet.time,
										location: bMeet.location,
										campus: bMeet.campus,
									},
								};
								// Create a dedupe key for this conflict detail to avoid duplicates
								const dedupeKey = `${b.id}|${bCls.classNumber}|${bMeet.time.start}|${bMeet.time.end}|${bMeet.location}|${bMeet.campus}`;
								conflictsByClassKey[keyA] = conflictsByClassKey[keyA] || [];
								conflictsKeySet[keyA] = conflictsKeySet[keyA] || new Set();
								if (!conflictsKeySet[keyA].has(dedupeKey)) {
									conflictsKeySet[keyA].add(dedupeKey);
									conflictsByClassKey[keyA].push(detail);
								}
								courseHasConflict[a.id] = true;
							}
						}
					}
				}
			}
		}
	}

	return { conflictsByClassKey, courseHasConflict };
};

export type { ConflictDetail };
