import type { Course, Meetings } from '../types/course';

export interface Preferences {
	earliestStart: string;
	latestEnd: string;
	preferredDays: string[];
	preferredBreak: number;
	maxDays: number;
	mode: 'HYBRID' | 'IN_PERSON' | 'ONLINE';
	ignoreLectures: boolean;
}

export type Variable = {
	courseId: string;
	courseCode: string;
	classTypeId: string;
	classTypeName: string;
	options: Array<{
		number: string;
		available_seats?: string;
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

const evaluateAssignment = (
	assignment: Assignment,
	variables: Variable[],
	preferences: Preferences,
): number => {
	let score = 0;

	type ScheduledMeeting = {
		courseId: string;
		classTypeId: string;
		classTypeName: string;
		classNumber: string;
		isFull: boolean;
		day: string;
		time: { start: string; end: string };
		location: string;
		campus: string;
	};

	const meetings: ScheduledMeeting[] = [];

	for (const variable of variables) {
		const chosenNumber = assignment[variable.classTypeId];
		const option = variable.options.find((o) => o.number === chosenNumber);
		if (!option) continue;

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
				location: m.location,
				campus: m.campus,
			});
		}
	}

	// 2. Conflict check
	for (let i = 0; i < meetings.length; i++) {
		const m1 = meetings[i];
		const isLec1 =
			m1.classTypeName.toLowerCase().startsWith('lecture') ||
			m1.classTypeName.toLowerCase().startsWith('lec');

		for (let j = i + 1; j < meetings.length; j++) {
			const m2 = meetings[j];
			if (m1.day !== m2.day) continue;

			const isLec2 =
				m2.classTypeName.toLowerCase().startsWith('lecture') ||
				m2.classTypeName.toLowerCase().startsWith('lec');
			if (preferences.ignoreLectures && (isLec1 || isLec2)) {
				continue;
			}

			if (timeRangesOverlap(m1.time, m2.time)) {
				score -= 200000; // Massive penalty for conflicts
			}
		}
	}

	// 3. Time Window constraints
	const startLimit = timeToMinutes(preferences.earliestStart);
	const endLimit = timeToMinutes(preferences.latestEnd);

	for (const m of meetings) {
		const isLec =
			m.classTypeName.toLowerCase().startsWith('lecture') ||
			m.classTypeName.toLowerCase().startsWith('lec');
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
		const isLec =
			m.classTypeName.toLowerCase().startsWith('lecture') ||
			m.classTypeName.toLowerCase().startsWith('lec');
		if (preferences.ignoreLectures && isLec) continue;

		if (!mappedPreferredDays.includes(m.day)) {
			score -= 500;
		}
	}

	// 5. Breaks and Days of Uni
	const meetingsByDay: Record<string, typeof meetings> = {};
	for (const m of meetings) {
		const isLec =
			m.classTypeName.toLowerCase().startsWith('lecture') ||
			m.classTypeName.toLowerCase().startsWith('lec');
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
			const endCurrent = timeToMinutes(dayMeetings[idx].time.end);
			const startNext = timeToMinutes(dayMeetings[idx + 1].time.start);
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
		const isLec =
			m.classTypeName.toLowerCase().startsWith('lecture') ||
			m.classTypeName.toLowerCase().startsWith('lec');
		if (preferences.ignoreLectures && isLec) continue;

		const isOnline =
			m.location.toLowerCase().includes('online') ||
			m.location.toLowerCase().includes('web') ||
			m.campus.toLowerCase().includes('online');

		if (preferences.mode === 'ONLINE' && !isOnline) {
			score -= 1000;
		}
		if (preferences.mode === 'IN_PERSON' && isOnline) {
			score -= 1000;
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
	const meetings: {
		day: string;
		time: { start: string; end: string };
		classTypeName: string;
	}[] = [];
	for (let i = 0; i <= varIdx; i++) {
		const v = variables[i];
		const chosen = assignment[v.classTypeId];
		const option = v.options.find((o) => o.number === chosen);
		if (!option) continue;

		for (const m of option.meetings) {
			meetings.push({
				day: m.day,
				time: m.time,
				classTypeName: v.classTypeName,
			});
		}
	}

	for (let i = 0; i < meetings.length; i++) {
		const m1 = meetings[i];
		const isLec1 =
			m1.classTypeName.toLowerCase().startsWith('lecture') ||
			m1.classTypeName.toLowerCase().startsWith('lec');

		for (let j = i + 1; j < meetings.length; j++) {
			const m2 = meetings[j];
			if (m1.day !== m2.day) continue;

			const isLec2 =
				m2.classTypeName.toLowerCase().startsWith('lecture') ||
				m2.classTypeName.toLowerCase().startsWith('lec');
			if (preferences.ignoreLectures && (isLec1 || isLec2)) continue;

			if (timeRangesOverlap(m1.time, m2.time)) {
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
		for (const v of variables) {
			const randomOption =
				v.options[Math.floor(Math.random() * v.options.length)];
			assignment[v.classTypeId] = randomOption.number;
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
				for (const option of v.options) {
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
		if (evaluations > 10000) return;

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
	const variables: Variable[] = [];
	for (const course of courses) {
		for (const ct of course.class_list) {
			if (ct.classes.length === 0) continue;
			variables.push({
				courseId: course.id,
				courseCode: course.name.code,
				classTypeId: ct.id,
				classTypeName: ct.type,
				options: ct.classes.map((c) => ({
					number: c.number,
					available_seats: c.available_seats,
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
): string[] => {
	const violations: string[] = [];

	type ScheduledMeeting = {
		day: string;
		time: { start: string; end: string };
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
		if (!option) continue;

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
				location: m.location,
				campus: m.campus,
			});
		}
	}

	if (hasFullClass) {
		violations.push('Includes full classes (no open seats available)');
	}

	// 1. Conflict check
	let hasConflict = false;
	for (let i = 0; i < meetings.length; i++) {
		const m1 = meetings[i];
		const isLec1 =
			m1.classTypeName.toLowerCase().startsWith('lecture') ||
			m1.classTypeName.toLowerCase().startsWith('lec');

		for (let j = i + 1; j < meetings.length; j++) {
			const m2 = meetings[j];
			if (m1.day !== m2.day) continue;

			const isLec2 =
				m2.classTypeName.toLowerCase().startsWith('lecture') ||
				m2.classTypeName.toLowerCase().startsWith('lec');
			if (preferences.ignoreLectures && (isLec1 || isLec2)) {
				continue;
			}

			if (timeRangesOverlap(m1.time, m2.time)) {
				hasConflict = true;
				break;
			}
		}
		if (hasConflict) break;
	}
	if (hasConflict) {
		violations.push('Contains class time conflicts (overlaps)');
	}

	// 2. Time limits
	const startLimit = timeToMinutes(preferences.earliestStart);
	const endLimit = timeToMinutes(preferences.latestEnd);
	let hasTimeViolation = false;

	for (const m of meetings) {
		const isLec =
			m.classTypeName.toLowerCase().startsWith('lecture') ||
			m.classTypeName.toLowerCase().startsWith('lec');
		if (preferences.ignoreLectures && isLec) continue;

		const mStart = timeToMinutes(m.time.start);
		const mEnd = timeToMinutes(m.time.end);

		if (mStart < startLimit || mEnd > endLimit) {
			hasTimeViolation = true;
			break;
		}
	}
	if (hasTimeViolation) {
		violations.push('Some classes are outside your preferred start/end times');
	}

	// 3. Preferred days
	let hasDayViolation = false;
	for (const m of meetings) {
		const isLec =
			m.classTypeName.toLowerCase().startsWith('lecture') ||
			m.classTypeName.toLowerCase().startsWith('lec');
		if (preferences.ignoreLectures && isLec) continue;

		if (!preferences.preferredDays.includes(m.day)) {
			hasDayViolation = true;
			break;
		}
	}
	if (hasDayViolation) {
		violations.push('Some classes are on your unpreferred days');
	}

	// 4. Max days
	const meetingsByDay: Record<string, typeof meetings> = {};
	for (const m of meetings) {
		const isLec =
			m.classTypeName.toLowerCase().startsWith('lecture') ||
			m.classTypeName.toLowerCase().startsWith('lec');
		if (preferences.ignoreLectures && isLec) continue;

		meetingsByDay[m.day] = meetingsByDay[m.day] || [];
		meetingsByDay[m.day].push(m);
	}
	const daysAtUni = Object.keys(meetingsByDay).length;
	if (daysAtUni > preferences.maxDays) {
		violations.push(
			`Attends university on ${daysAtUni} days (preferred max: ${preferences.maxDays})`,
		);
	}

	// 5. Mode mismatch
	let hasModeViolation = false;
	for (const m of meetings) {
		const isLec =
			m.classTypeName.toLowerCase().startsWith('lecture') ||
			m.classTypeName.toLowerCase().startsWith('lec');
		if (preferences.ignoreLectures && isLec) continue;

		const isOnline =
			m.location.toLowerCase().includes('online') ||
			m.location.toLowerCase().includes('web') ||
			m.campus.toLowerCase().includes('online');

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
			`Includes classes not matching your preferred mode (${preferences.mode === 'ONLINE' ? 'Online' : 'In-person'})`,
		);
	}

	return violations;
};
