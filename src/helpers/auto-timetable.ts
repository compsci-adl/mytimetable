import { useFilters } from '../data/filters';
import type { Course, Meetings } from '../types/course';
import { dateRangesOverlap, isMeetingInTerm } from '../utils/date';

export interface Preferences {
	earliestStart: string;
	latestEnd: string;
	preferredDays: string[];
	preferredBreak: number;
	maxDays: number;
	mode: 'HYBRID' | 'IN_PERSON' | 'ONLINE';
	ignoreLectures: boolean;
	enableLunch: boolean;
	lunchStart: string;
	lunchEnd: string;
}

export type Variable = {
	courseId: string;
	courseCode: string;
	classTypeId: string;
	classTypeName: string;
	options: Array<{
		number: string;
		available_seats?: string;
		group?: string;
		meetings: Meetings;
	}>;
};

export type Assignment = Record<string, string>; // Maps classTypeId to classNumber

export const timeToMinutes = (timeStr: string): number => {
	const [hStr, mStr] = timeStr.split(':');
	return parseInt(hStr, 10) * 60 + parseInt(mStr, 10);
};

export const timeRangesOverlap = (
	a: { start: string; end: string },
	b: { start: string; end: string },
): boolean => {
	const aStart = timeToMinutes(a.start);
	const aEnd = timeToMinutes(a.end);
	const bStart = timeToMinutes(b.start);
	const bEnd = timeToMinutes(b.end);
	return aEnd > bStart && bEnd > aStart;
};

export const isLectureMeeting = (classTypeName?: string): boolean => {
	const name = (classTypeName || '').toLowerCase();
	return (
		name.startsWith('lecture') ||
		name.startsWith('lec') ||
		name.startsWith('seminar') ||
		name.startsWith('sem')
	);
};

export const isOnlineMeeting = (
	location?: string,
	campus?: string,
): boolean => {
	return (
		(location || '').toLowerCase().includes('online') ||
		(location || '').toLowerCase().includes('web') ||
		(campus || '').toLowerCase().includes('online')
	);
};

const evaluateAssignment = (
	assignment: Assignment,
	variables: Variable[],
	preferences: Preferences,
): number => {
	let score = 0;

	// Group consistency check for the same course
	const groupsByCourse: Record<string, string> = {};
	for (const variable of variables) {
		const chosenNumber = assignment[variable.classTypeId];
		const option = variable.options.find((o) => o.number === chosenNumber);
		if (option?.group) {
			const existingGroup = groupsByCourse[variable.courseId];
			if (existingGroup && existingGroup !== option.group) {
				score -= 500000;
			} else {
				groupsByCourse[variable.courseId] = option.group;
			}
		}
	}

	type ScheduledMeeting = {
		courseId: string;
		classTypeId: string;
		classTypeName: string;
		classNumber: string;
		isFull: boolean;
		day: string;
		time: { start: string; end: string };
		date: { start: string; end: string };
		location: string;
		campus: string;
	};

	const meetings: ScheduledMeeting[] = [];

	for (const variable of variables) {
		const chosenNumber = assignment[variable.classTypeId];
		const option = variable.options.find((o) => o.number === chosenNumber);
		/* v8 ignore start */
		if (!option) continue;
		/* v8 ignore stop */

		const isFull =
			option.available_seats !== undefined &&
			parseInt(option.available_seats, 10) === 0;
		if (isFull) {
			score -= 100000; // Avoid full classes as requested by the user
		}

		for (const m of option.meetings) {
			meetings.push({
				courseId: variable.courseId,
				classTypeId: variable.classTypeId,
				classTypeName: variable.classTypeName,
				classNumber: chosenNumber,
				isFull,
				day: m.day,
				time: m.time,
				date: m.date,
				location: m.location,
				campus: m.campus,
			});
		}
	}

	// 2. Conflict check
	for (let i = 0; i < meetings.length; i++) {
		const m1 = meetings[i];
		const isLec1 = isLectureMeeting(m1.classTypeName);

		for (let j = i + 1; j < meetings.length; j++) {
			const m2 = meetings[j];
			if (m1.day !== m2.day) continue;

			const isLec2 = isLectureMeeting(m2.classTypeName);

			if (
				dateRangesOverlap(m1.date, m2.date) &&
				timeRangesOverlap(m1.time, m2.time)
			) {
				if (preferences.ignoreLectures && (isLec1 || isLec2)) {
					score -= 1000; // Soft penalty to avoid lecture conflicts if possible
				} else {
					score -= 200000; // Massive penalty for conflicts
				}
			}
		}
	}

	// 3. Time Window constraints
	const startLimit = timeToMinutes(preferences.earliestStart);
	const endLimit = timeToMinutes(preferences.latestEnd);

	for (const m of meetings) {
		const isLec = isLectureMeeting(m.classTypeName);
		if (preferences.ignoreLectures && isLec) continue;

		const mStart = timeToMinutes(m.time.start);
		const mEnd = timeToMinutes(m.time.end);

		if (mStart < startLimit) {
			score -= (startLimit - mStart) * 10;
		}
		if (mEnd > endLimit) {
			score -= (mEnd - endLimit) * 10;
		}
	}

	// 4. Preferred Days constraints
	const mappedPreferredDays = preferences.preferredDays;
	for (const m of meetings) {
		const isLec = isLectureMeeting(m.classTypeName);
		if (preferences.ignoreLectures && isLec) continue;

		if (!mappedPreferredDays.includes(m.day)) {
			score -= 500;
		}
	}

	// 5. Breaks and Days of Uni
	const meetingsByDay: Record<string, typeof meetings> = {};
	for (const m of meetings) {
		const isLec = isLectureMeeting(m.classTypeName);
		if (preferences.ignoreLectures && isLec) continue;

		meetingsByDay[m.day] = meetingsByDay[m.day] || [];
		meetingsByDay[m.day].push(m);
	}

	const daysAtUni = Object.keys(meetingsByDay).length;
	if (daysAtUni > preferences.maxDays) {
		score -= (daysAtUni - preferences.maxDays) * 5000;
	}
	// Small positive reward for fewer days
	score += (5 - daysAtUni) * 100;

	// Breaks scoring
	const preferredBreakMinutes = preferences.preferredBreak * 60;
	for (const day of Object.keys(meetingsByDay)) {
		const dayMeetings = meetingsByDay[day];
		dayMeetings.sort(
			(a, b) => timeToMinutes(a.time.start) - timeToMinutes(b.time.start),
		);

		for (let idx = 0; idx < dayMeetings.length - 1; idx++) {
			const m1 = dayMeetings[idx];
			let m2 = null;
			for (let j = idx + 1; j < dayMeetings.length; j++) {
				if (dateRangesOverlap(m1.date, dayMeetings[j].date)) {
					m2 = dayMeetings[j];
					break;
				}
			}
			if (!m2) continue;

			const endCurrent = timeToMinutes(m1.time.end);
			const startNext = timeToMinutes(m2.time.start);
			const breakDuration = startNext - endCurrent;

			if (breakDuration > preferredBreakMinutes) {
				score -= (breakDuration - preferredBreakMinutes) * 2;
			} else if (breakDuration < preferredBreakMinutes) {
				score -= (preferredBreakMinutes - breakDuration) * 1;
			}
		}
	}

	// 6. Mode constraints
	for (const m of meetings) {
		const isLec = isLectureMeeting(m.classTypeName);
		if (preferences.ignoreLectures && isLec) continue;

		const isOnline = isOnlineMeeting(m.location, m.campus);

		if (preferences.mode === 'ONLINE' && !isOnline) {
			score -= 1000;
		}
		if (preferences.mode === 'IN_PERSON' && isOnline) {
			score -= 1000;
		}
	}

	// 7. Lunch Break constraints
	if (preferences.enableLunch) {
		const lunchStartMinutes = timeToMinutes(preferences.lunchStart);
		const lunchEndMinutes = timeToMinutes(preferences.lunchEnd);

		for (const m of meetings) {
			const isLec = isLectureMeeting(m.classTypeName);
			if (preferences.ignoreLectures && isLec) continue;

			const mStart = timeToMinutes(m.time.start);
			const mEnd = timeToMinutes(m.time.end);

			const overlapsLunch =
				mEnd > lunchStartMinutes && mStart < lunchEndMinutes;
			if (overlapsLunch) {
				score -= 1500; // Soft penalty for violating preferred lunch break
			}
		}
	}

	return score;
};

const hasPartialConflict = (
	assignment: Assignment,
	variables: Variable[],
	preferences: Preferences,
	varIdx: number,
): boolean => {
	if (varIdx >= 0) {
		const currentVar = variables[varIdx];
		const currentChosen = assignment[currentVar.classTypeId];
		const currentOption = currentVar.options.find(
			(o) => o.number === currentChosen,
		);
		if (currentOption?.group) {
			for (let i = 0; i < varIdx; i++) {
				const prevVar = variables[i];
				if (prevVar.courseId === currentVar.courseId) {
					const prevChosen = assignment[prevVar.classTypeId];
					const prevOption = prevVar.options.find(
						(o) => o.number === prevChosen,
					);
					if (prevOption?.group && prevOption.group !== currentOption.group) {
						return true; // Prune branch due to group mismatch
					}
				}
			}
		}
	}

	const meetings: {
		day: string;
		time: { start: string; end: string };
		date: { start: string; end: string };
		classTypeName: string;
	}[] = [];
	for (let i = 0; i <= varIdx; i++) {
		const v = variables[i];
		const chosen = assignment[v.classTypeId];
		const option = v.options.find((o) => o.number === chosen);
		/* v8 ignore start */
		if (!option) continue;
		/* v8 ignore stop */

		for (const m of option.meetings) {
			meetings.push({
				day: m.day,
				time: m.time,
				date: m.date,
				classTypeName: v.classTypeName,
			});
		}
	}

	for (let i = 0; i < meetings.length; i++) {
		const m1 = meetings[i];
		const isLec1 = isLectureMeeting(m1.classTypeName);

		for (let j = i + 1; j < meetings.length; j++) {
			const m2 = meetings[j];
			if (m1.day !== m2.day) continue;

			const isLec2 = isLectureMeeting(m2.classTypeName);
			if (preferences.ignoreLectures && (isLec1 || isLec2)) continue;

			if (
				dateRangesOverlap(m1.date, m2.date) &&
				timeRangesOverlap(m1.time, m2.time)
			) {
				return true;
			}
		}
	}
	return false;
};

const solveLocalSearch = (
	variables: Variable[],
	preferences: Preferences,
): Assignment => {
	let bestScore = -Infinity;
	let bestAssignment: Assignment = {};

	const getRandomAssignment = (): Assignment => {
		const assignment: Assignment = {};
		const courseVarsMap: Record<string, Variable[]> = {};
		for (const v of variables) {
			courseVarsMap[v.courseId] = courseVarsMap[v.courseId] || [];
			courseVarsMap[v.courseId].push(v);
		}
		for (const [, vars] of Object.entries(courseVarsMap)) {
			const groups = Array.from(
				new Set(
					vars
						.flatMap((v) => v.options.map((o) => o.group))
						.filter(
							(g): g is string => typeof g === 'string' && g.trim() !== '',
						),
				),
			);
			const chosenGroup =
				groups.length > 0
					? groups[Math.floor(Math.random() * groups.length)]
					: undefined;
			for (const v of vars) {
				const groupOptions = chosenGroup
					? v.options.filter((o) => !o.group || o.group === chosenGroup)
					: v.options;
				const pool = groupOptions.length > 0 ? groupOptions : v.options;
				const randomOption = pool[Math.floor(Math.random() * pool.length)];
				assignment[v.classTypeId] = randomOption.number;
			}
		}
		return assignment;
	};

	const numRestarts = 100;
	for (let run = 0; run < numRestarts; run++) {
		const current = getRandomAssignment();
		let currentScore = evaluateAssignment(current, variables, preferences);
		let improved = true;

		while (improved) {
			improved = false;
			for (const v of variables) {
				const originalVal = current[v.classTypeId];
				const currentOpt = v.options.find((o) => o.number === originalVal);
				const currentGroup = currentOpt?.group;
				const candidateOptions = currentGroup
					? v.options.filter((o) => !o.group || o.group === currentGroup)
					: v.options;
				for (const option of candidateOptions) {
					if (option.number === originalVal) continue;
					current[v.classTypeId] = option.number;
					const newScore = evaluateAssignment(current, variables, preferences);
					if (newScore > currentScore) {
						currentScore = newScore;
						improved = true;
					} else {
						current[v.classTypeId] = originalVal;
					}
				}
			}
		}

		if (currentScore > bestScore) {
			bestScore = currentScore;
			bestAssignment = { ...current };
		}
	}

	return bestAssignment;
};

export const solveAutoTimetable = (
	variables: Variable[],
	preferences: Preferences,
): Assignment | null => {
	if (variables.length === 0) return null;

	const totalCombinations = variables.reduce(
		(acc, v) => acc * v.options.length,
		1,
	);
	if (totalCombinations > 10000) {
		return solveLocalSearch(variables, preferences);
	}

	let bestScore = -Infinity;
	let bestAssignment: Assignment | null = null;

	const currentAssignment: Assignment = {};
	let evaluations = 0;

	const backtrack = (varIdx: number, requireConflictFree: boolean) => {
		/* v8 ignore start */
		if (evaluations > 10000) return;
		/* v8 ignore stop */

		if (
			requireConflictFree &&
			hasPartialConflict(currentAssignment, variables, preferences, varIdx - 1)
		) {
			return;
		}

		if (varIdx === variables.length) {
			evaluations++;
			const score = evaluateAssignment(
				currentAssignment,
				variables,
				preferences,
			);
			if (score > bestScore) {
				bestScore = score;
				bestAssignment = { ...currentAssignment };
			}
			return;
		}

		const variable = variables[varIdx];
		for (const option of variable.options) {
			currentAssignment[variable.classTypeId] = option.number;
			backtrack(varIdx + 1, requireConflictFree);
		}
	};

	// Stage 1: Try with pruning (requiring conflict-free)
	backtrack(0, true);

	// Stage 2: Fallback to full search if no conflict-free solution
	if (!bestAssignment) {
		bestScore = -Infinity;
		evaluations = 0;
		backtrack(0, false);
	}

	return bestAssignment;
};

export const coursesToVariables = (courses: Course[]): Variable[] => {
	const selectedTermAlias = useFilters.getState().term;
	const selectedCampuses = useFilters.getState().campuses;

	const variables: Variable[] = [];
	for (const course of courses) {
		for (const ct of course.class_list) {
			const classesInTerm = ct.classes.filter((classInfo) =>
				classInfo.meetings.some(
					(m) =>
						isMeetingInTerm(m.date, selectedTermAlias) &&
						(!selectedCampuses ||
							selectedCampuses.length === 0 ||
							selectedCampuses.includes(m.campus)),
				),
			);
			if (classesInTerm.length === 0) continue;
			variables.push({
				courseId: course.id,
				courseCode: course.name.code,
				classTypeId: ct.id,
				classTypeName: ct.type,
				options: classesInTerm.map((c) => ({
					number: c.number,
					available_seats: c.available_seats,
					group: c.group,
					meetings: c.meetings,
				})),
			});
		}
	}
	return variables;
};

export const checkViolations = (
	assignment: Assignment,
	variables: Variable[],
	preferences: Preferences,
	t?: (key: string, options?: Record<string, string | number>) => string,
): string[] => {
	const violations: string[] = [];
	const tr = (
		key: string,
		fallback: string,
		options?: Record<string, string | number>,
	) => {
		if (t) {
			return t(key, { defaultValue: fallback, ...options });
		}
		let text = fallback;
		if (options) {
			Object.entries(options).forEach(([k, v]) => {
				text = text.replace(`{{${k}}}`, String(v));
			});
		}
		return text;
	};

	type ScheduledMeeting = {
		day: string;
		time: { start: string; end: string };
		date: { start: string; end: string };
		classTypeName: string;
		isFull: boolean;
		location: string;
		campus: string;
	};

	const meetings: ScheduledMeeting[] = [];
	let hasFullClass = false;

	for (const variable of variables) {
		const chosenNumber = assignment[variable.classTypeId];
		const option = variable.options.find((o) => o.number === chosenNumber);
		/* v8 ignore start */
		if (!option) continue;
		/* v8 ignore stop */

		const isFull =
			option.available_seats !== undefined &&
			parseInt(option.available_seats, 10) === 0;
		if (isFull) {
			hasFullClass = true;
		}

		for (const m of option.meetings) {
			meetings.push({
				classTypeName: variable.classTypeName,
				isFull,
				day: m.day,
				time: m.time,
				date: m.date,
				location: m.location,
				campus: m.campus,
			});
		}
	}

	if (hasFullClass) {
		violations.push(
			tr(
				'toast.auto-timetable-warning-full-classes',
				'Includes full classes (no open seats available)',
			),
		);
	}

	// 1. Conflict check
	let hasConflict = false;
	for (let i = 0; i < meetings.length; i++) {
		const m1 = meetings[i];
		const isLec1 = isLectureMeeting(m1.classTypeName);

		for (let j = i + 1; j < meetings.length; j++) {
			const m2 = meetings[j];
			if (m1.day !== m2.day) continue;

			const isLec2 = isLectureMeeting(m2.classTypeName);
			if (preferences.ignoreLectures && (isLec1 || isLec2)) {
				continue;
			}

			if (
				dateRangesOverlap(m1.date, m2.date) &&
				timeRangesOverlap(m1.time, m2.time)
			) {
				hasConflict = true;
				break;
			}
		}
		if (hasConflict) break;
	}
	if (hasConflict) {
		violations.push(
			tr(
				'toast.auto-timetable-warning-conflicts',
				'Contains class time conflicts (overlaps)',
			),
		);
	}

	// 2. Time limits
	const startLimit = timeToMinutes(preferences.earliestStart);
	const endLimit = timeToMinutes(preferences.latestEnd);
	let hasTimeViolation = false;

	for (const m of meetings) {
		const isLec = isLectureMeeting(m.classTypeName);
		if (preferences.ignoreLectures && isLec) continue;

		const mStart = timeToMinutes(m.time.start);
		const mEnd = timeToMinutes(m.time.end);

		if (mStart < startLimit || mEnd > endLimit) {
			hasTimeViolation = true;
			break;
		}
	}
	if (hasTimeViolation) {
		violations.push(
			tr(
				'toast.auto-timetable-warning-outside-hours',
				'Some classes are outside your preferred start/end times',
			),
		);
	}

	// 3. Preferred days
	let hasDayViolation = false;
	for (const m of meetings) {
		const isLec = isLectureMeeting(m.classTypeName);
		if (preferences.ignoreLectures && isLec) continue;

		if (!preferences.preferredDays.includes(m.day)) {
			hasDayViolation = true;
			break;
		}
	}
	if (hasDayViolation) {
		violations.push(
			tr(
				'toast.auto-timetable-warning-unpreferred-days',
				'Some classes are on your unpreferred days',
			),
		);
	}

	// 4. Max days
	const meetingsByDay: Record<string, typeof meetings> = {};
	for (const m of meetings) {
		const isLec = isLectureMeeting(m.classTypeName);
		if (preferences.ignoreLectures && isLec) continue;

		meetingsByDay[m.day] = meetingsByDay[m.day] || [];
		meetingsByDay[m.day].push(m);
	}
	const daysAtUni = Object.keys(meetingsByDay).length;
	if (daysAtUni > preferences.maxDays) {
		violations.push(
			tr(
				'toast.auto-timetable-warning-max-days',
				'Attends university on {{count}} days (preferred max: {{max}})',
				{ count: daysAtUni, max: preferences.maxDays },
			),
		);
	}

	// 5. Mode mismatch
	let hasModeViolation = false;
	for (const m of meetings) {
		const isLec = isLectureMeeting(m.classTypeName);
		if (preferences.ignoreLectures && isLec) continue;

		const isOnline = isOnlineMeeting(m.location, m.campus);

		if (preferences.mode === 'ONLINE' && !isOnline) {
			hasModeViolation = true;
			break;
		}
		if (preferences.mode === 'IN_PERSON' && isOnline) {
			hasModeViolation = true;
			break;
		}
	}
	if (hasModeViolation) {
		violations.push(
			tr(
				'toast.auto-timetable-warning-mode-mismatch',
				'Includes classes not matching your preferred mode ({{mode}})',
				{
					mode:
						preferences.mode === 'ONLINE'
							? tr('auto-timetable.online', 'Online')
							: tr('auto-timetable.in-person', 'In-person'),
				},
			),
		);
	}

	// 6. Lunch Break
	if (preferences.enableLunch) {
		const lunchStartMinutes = timeToMinutes(preferences.lunchStart);
		const lunchEndMinutes = timeToMinutes(preferences.lunchEnd);
		let hasLunchViolation = false;

		for (const m of meetings) {
			const isLec = isLectureMeeting(m.classTypeName);
			if (preferences.ignoreLectures && isLec) continue;

			const mStart = timeToMinutes(m.time.start);
			const mEnd = timeToMinutes(m.time.end);

			if (mEnd > lunchStartMinutes && mStart < lunchEndMinutes) {
				hasLunchViolation = true;
				break;
			}
		}
		if (hasLunchViolation) {
			violations.push(
				tr(
					'toast.auto-timetable-warning-lunch-overlap',
					'Some classes overlap with your preferred lunch break',
				),
			);
		}
	}

	return violations;
};
