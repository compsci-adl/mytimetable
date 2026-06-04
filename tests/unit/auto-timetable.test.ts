import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useFilters } from '../../src/data/filters';
import {
	timeToMinutes,
	timeRangesOverlap,
	solveAutoTimetable,
	checkViolations,
	coursesToVariables,
	isLectureMeeting,
	isOnlineMeeting,
	type Variable,
	type Preferences,
	type Assignment,
} from '../../src/helpers/auto-timetable';
import type { Course } from '../../src/types/course';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const makePrefs = (overrides: Partial<Preferences> = {}): Preferences => ({
	earliestStart: '09:00',
	latestEnd: '17:00',
	preferredDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
	preferredBreak: 1,
	maxDays: 5,
	mode: 'HYBRID',
	ignoreLectures: false,
	enableLunch: false,
	lunchStart: '12:00',
	lunchEnd: '13:00',
	...overrides,
});

const makeMeeting = (
	day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday',
	start: string,
	end: string,
	overrides: Record<string, unknown> = {},
) => ({
	day,
	location: 'Room A',
	campus: 'North Terrace',
	date: { start: '03-01', end: '06-01' },
	time: { start, end },
	...overrides,
});

const makeVariable = (
	id: string,
	name: string,
	options: Variable['options'],
): Variable => ({
	courseId: 'course-1',
	courseCode: 'TEST1001',
	classTypeId: id,
	classTypeName: name,
	options,
});

// ---------------------------------------------------------------------------
// timeToMinutes
// ---------------------------------------------------------------------------

describe('timeToMinutes', () => {
	it('should convert time string to minutes', () => {
		expect(timeToMinutes('00:00')).toBe(0);
		expect(timeToMinutes('09:30')).toBe(570);
		expect(timeToMinutes('21:00')).toBe(1260);
	});
});

// ---------------------------------------------------------------------------
// timeRangesOverlap
// ---------------------------------------------------------------------------

describe('timeRangesOverlap', () => {
	it('should identify overlaps correctly', () => {
		expect(
			timeRangesOverlap(
				{ start: '09:00', end: '11:00' },
				{ start: '10:00', end: '12:00' },
			),
		).toBe(true);
		expect(
			timeRangesOverlap(
				{ start: '09:00', end: '10:00' },
				{ start: '10:00', end: '11:00' },
			),
		).toBe(false);
		expect(
			timeRangesOverlap(
				{ start: '09:00', end: '10:00' },
				{ start: '11:00', end: '12:00' },
			),
		).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// solveAutoTimetable - basic solver
// ---------------------------------------------------------------------------

describe('solveAutoTimetable solver', () => {
	const mockVariables: Variable[] = [
		makeVariable('type-1', 'Lecture', [
			{
				number: '101',
				available_seats: '10',
				meetings: [makeMeeting('Monday', '09:00', '11:00')],
			},
			{
				number: '102',
				available_seats: '10',
				meetings: [makeMeeting('Tuesday', '14:00', '16:00')],
			},
		]),
		makeVariable('type-2', 'Practical', [
			{
				number: '201',
				available_seats: '5',
				meetings: [makeMeeting('Monday', '10:00', '12:00')],
			},
			{
				number: '202',
				available_seats: '5',
				meetings: [makeMeeting('Tuesday', '10:00', '12:00')],
			},
		]),
	];

	const defaultPreferences = makePrefs();

	it('should find a conflict-free solution when one exists', () => {
		const result = solveAutoTimetable(mockVariables, defaultPreferences);
		expect(result).toBeDefined();
		if (result) {
			const isConflict =
				result['type-1'] === '101' && result['type-2'] === '201';
			expect(isConflict).toBe(false);
		}
	});

	it('should return null when no variables provided', () => {
		expect(solveAutoTimetable([], defaultPreferences)).toBeNull();
	});

	it('should avoid full classes if a non-full alternative exists', () => {
		const variablesWithFull = JSON.parse(JSON.stringify(mockVariables));
		variablesWithFull[0].options[1].available_seats = '0'; // 102 is now full

		const result = solveAutoTimetable(variablesWithFull, defaultPreferences);
		expect(result).toBeDefined();
		if (result) {
			expect(result['type-1']).toBe('101');
			expect(result['type-2']).toBe('202');
		}
	});

	it('should ignore lecture overlaps if ignoreLectures is true', () => {
		const vars = [
			makeVariable('type-1', 'Lecture', [
				{
					number: '101',
					available_seats: '10',
					meetings: [makeMeeting('Monday', '09:00', '11:00')],
				},
			]),
			makeVariable('type-2', 'Practical', [
				{
					number: '201',
					available_seats: '5',
					meetings: [makeMeeting('Monday', '10:00', '12:00')],
				},
			]),
		];

		const resultIgnore = solveAutoTimetable(
			vars,
			makePrefs({ ignoreLectures: true }),
		);
		expect(resultIgnore).toEqual({ 'type-1': '101', 'type-2': '201' });
	});

	it('should fall back to full search if no conflict-free solution found', () => {
		// Both options conflict - solver must fall back to any best solution
		const vars = [
			makeVariable('type-1', 'Workshop', [
				{
					number: '101',
					available_seats: '10',
					meetings: [makeMeeting('Monday', '09:00', '11:00')],
				},
			]),
			makeVariable('type-2', 'Workshop', [
				{
					number: '201',
					available_seats: '5',
					meetings: [makeMeeting('Monday', '09:30', '11:30')],
				},
			]),
		];
		const result = solveAutoTimetable(vars, defaultPreferences);
		expect(result).toBeDefined();
		expect(result!['type-1']).toBe('101');
		expect(result!['type-2']).toBe('201');
	});

	it('should use local search for large search spaces (>10000 combos)', () => {
		// Create 5 variables each with 5 options — 5^5=3125; use 6 vars with 5 each = 5^6=15625 > 10000
		const bigVars: Variable[] = Array.from({ length: 6 }, (_, i) =>
			makeVariable(`type-${i}`, 'Workshop', [
				{
					number: `${i}01`,
					available_seats: '5',
					meetings: [makeMeeting('Monday', '09:00', '10:00')],
				},
				{
					number: `${i}02`,
					available_seats: '5',
					meetings: [makeMeeting('Tuesday', '09:00', '10:00')],
				},
				{
					number: `${i}03`,
					available_seats: '5',
					meetings: [makeMeeting('Wednesday', '09:00', '10:00')],
				},
				{
					number: `${i}04`,
					available_seats: '5',
					meetings: [makeMeeting('Thursday', '09:00', '10:00')],
				},
				{
					number: `${i}05`,
					available_seats: '5',
					meetings: [makeMeeting('Friday', '09:00', '10:00')],
				},
			]),
		);
		const result = solveAutoTimetable(bigVars, defaultPreferences);
		expect(result).toBeDefined();
		// Should have assigned each variable
		bigVars.forEach((v) => {
			expect(result![v.classTypeId]).toBeDefined();
		});
	});

	it('should prefer online classes when mode is ONLINE', () => {
		const vars = [
			makeVariable('type-1', 'Lecture', [
				{
					number: '101',
					available_seats: '10',
					meetings: [
						makeMeeting('Monday', '09:00', '10:00', {
							location: 'online',
							campus: 'Online',
						}),
					],
				},
				{
					number: '102',
					available_seats: '10',
					meetings: [makeMeeting('Tuesday', '09:00', '10:00')],
				},
			]),
		];
		const result = solveAutoTimetable(vars, makePrefs({ mode: 'ONLINE' }));
		expect(result!['type-1']).toBe('101');
	});

	it('should apply lunch break scoring when enableLunch is true', () => {
		const vars = [
			makeVariable('type-1', 'Workshop', [
				{
					number: '101',
					available_seats: '5',
					meetings: [makeMeeting('Monday', '09:00', '10:00')],
				},
				{
					number: '102',
					available_seats: '5',
					meetings: [makeMeeting('Monday', '12:00', '13:00')],
				},
			]),
		];
		const result = solveAutoTimetable(
			vars,
			makePrefs({ enableLunch: true, lunchStart: '12:00', lunchEnd: '13:00' }),
		);
		// Should prefer 101 (doesn't overlap lunch)
		expect(result!['type-1']).toBe('101');
	});

	it('should penalise classes outside preferred time window', () => {
		const vars = [
			makeVariable('type-1', 'Workshop', [
				{
					number: '101',
					available_seats: '5',
					meetings: [makeMeeting('Monday', '08:00', '09:00')],
				},
				{
					number: '102',
					available_seats: '5',
					meetings: [makeMeeting('Monday', '10:00', '11:00')],
				},
			]),
		];
		const result = solveAutoTimetable(
			vars,
			makePrefs({ earliestStart: '09:00' }),
		);
		expect(result!['type-1']).toBe('102');
	});

	it('should penalise classes on unpreferred days', () => {
		const vars = [
			makeVariable('type-1', 'Workshop', [
				{
					number: '101',
					available_seats: '5',
					meetings: [makeMeeting('Wednesday', '10:00', '11:00')],
				},
				{
					number: '102',
					available_seats: '5',
					meetings: [makeMeeting('Monday', '10:00', '11:00')],
				},
			]),
		];
		const result = solveAutoTimetable(
			vars,
			makePrefs({ preferredDays: ['Monday', 'Tuesday'] }),
		);
		expect(result!['type-1']).toBe('102');
	});

	it('should penalise classes that end after latestEnd (mEnd > endLimit)', () => {
		const vars = [
			makeVariable('type-1', 'Workshop', [
				{
					number: '101',
					available_seats: '5',
					meetings: [makeMeeting('Monday', '10:00', '19:00')],
				}, // ends after 17:00
				{
					number: '102',
					available_seats: '5',
					meetings: [makeMeeting('Monday', '10:00', '12:00')],
				}, // within window
			]),
		];
		const result = solveAutoTimetable(vars, makePrefs({ latestEnd: '17:00' }));
		expect(result!['type-1']).toBe('102');
	});

	it('should penalise online classes when mode is IN_PERSON (evaluateAssignment scoring)', () => {
		const vars = [
			makeVariable('type-1', 'Workshop', [
				{
					number: '101',
					available_seats: '5',
					meetings: [
						makeMeeting('Monday', '09:00', '10:00', {
							location: 'online',
							campus: 'Online',
						}),
					],
				},
				{
					number: '102',
					available_seats: '5',
					meetings: [makeMeeting('Monday', '09:00', '10:00')],
				},
			]),
		];
		const result = solveAutoTimetable(vars, makePrefs({ mode: 'IN_PERSON' }));
		expect(result!['type-1']).toBe('102');
	});

	it('should penalise exceeding max days at uni', () => {
		const vars = [
			makeVariable('type-1', 'Workshop', [
				{
					number: '101',
					available_seats: '5',
					meetings: [makeMeeting('Monday', '10:00', '11:00')],
				},
			]),
			makeVariable('type-2', 'Workshop', [
				{
					number: '201',
					available_seats: '5',
					meetings: [makeMeeting('Monday', '14:00', '15:00')],
				},
				{
					number: '202',
					available_seats: '5',
					meetings: [makeMeeting('Tuesday', '14:00', '15:00')],
				},
			]),
		];
		// With maxDays=1, prefer both on Monday
		const result = solveAutoTimetable(vars, makePrefs({ maxDays: 1 }));
		// Both on Monday is preferred to spread across days
		expect(result!['type-2']).toBe('201');
	});
});

// ---------------------------------------------------------------------------
// coursesToVariables
// ---------------------------------------------------------------------------

describe('coursesToVariables', () => {
	const localStorageStore: Record<string, string> = {};
	const localStorageMock = {
		getItem: (key: string) => localStorageStore[key] ?? null,
		setItem: (key: string, value: string) => {
			localStorageStore[key] = value;
		},
		removeItem: (key: string) => {
			delete localStorageStore[key];
		},
		clear: () => {
			Object.keys(localStorageStore).forEach(
				(k) => delete localStorageStore[k],
			);
		},
	};

	beforeEach(() => {
		Object.defineProperty(globalThis, 'localStorage', {
			value: localStorageMock,
			writable: true,
		});
		localStorageMock.setItem('MTT.term', 'sem2'); // months [7..12]
		localStorageMock.removeItem('MTT.campuses');
		useFilters.setState({ term: 'sem2', campuses: undefined });
	});

	const makeCourse = (classesForTerm: boolean) =>
		({
			id: 'course-1',
			course_id: 'crs-1',
			name: { subject: 'CS', code: 'CS101', title: 'Intro CS' },
			university_wide_elective: false,
			level_of_study: 'undergraduate',
			class_list: [
				{
					id: 'ct-1',
					category: 'enrolment' as const,
					type: 'Lecture',
					classes: classesForTerm
						? [
								{
									number: '101',
									available_seats: '10',
									size: '100',
									meetings: [
										{
											day: 'Monday',
											location: 'Room A',
											campus: 'North Terrace',
											date: { start: '07-22', end: '09-09' }, // within sem2
											time: { start: '09:00', end: '10:00' },
										},
									],
								},
							]
						: [
								{
									number: '101',
									available_seats: '10',
									size: '100',
									meetings: [
										{
											day: 'Monday',
											location: 'Room A',
											campus: 'North Terrace',
											date: { start: '03-01', end: '05-01' }, // sem1 only — excluded from sem2
											time: { start: '09:00', end: '10:00' },
										},
									],
								},
							],
				},
			],
		}) as unknown as Course;

	it('should convert courses to variables for the current term', () => {
		const result = coursesToVariables([makeCourse(true)]);
		expect(result.length).toBe(1);
		expect(result[0].classTypeId).toBe('ct-1');
		expect(result[0].options.length).toBe(1);
		expect(result[0].options[0].number).toBe('101');
	});

	it('should skip class types that have no classes in current term', () => {
		const result = coursesToVariables([makeCourse(false)]);
		expect(result.length).toBe(0);
	});

	it('should use sem1 as default if no term is set in localStorage', () => {
		localStorageMock.removeItem('MTT.term');
		useFilters.setState({ term: 'sem1' });
		const result = coursesToVariables([makeCourse(false)]);
		// sem1 = [2..7], course has Mar-May so it qualifies
		expect(result.length).toBe(1);
	});

	it('should filter by selected campuses when specified in localStorage', () => {
		localStorageMock.setItem('MTT.campuses', JSON.stringify(['North Terrace']));
		useFilters.setState({ campuses: ['North Terrace'] });
		const result = coursesToVariables([makeCourse(true)]);
		expect(result.length).toBe(1);
	});

	it('should exclude classes that do not match the selected campuses', () => {
		localStorageMock.setItem(
			'MTT.campuses',
			JSON.stringify(['Roseworthy Campus']),
		);
		useFilters.setState({ campuses: ['Roseworthy Campus'] });
		const result = coursesToVariables([makeCourse(true)]);
		expect(result.length).toBe(0);
	});

	it('should handle empty campus list in localStorage as no filter', () => {
		localStorageMock.setItem('MTT.campuses', JSON.stringify([]));
		useFilters.setState({ campuses: [] });
		const result = coursesToVariables([makeCourse(true)]);
		expect(result.length).toBe(1);
	});
});

// ---------------------------------------------------------------------------
// checkViolations
// ---------------------------------------------------------------------------

describe('checkViolations utility', () => {
	const mockVariables: Variable[] = [
		makeVariable('type-1', 'Lecture', [
			{
				number: '101',
				available_seats: '0', // Full class
				meetings: [makeMeeting('Monday', '08:00', '10:00')], // Starts before 09:00
			},
			{
				number: '102',
				available_seats: '10',
				meetings: [makeMeeting('Tuesday', '10:00', '12:00')],
			},
		]),
	];

	const defaultPreferences = makePrefs({ preferredDays: ['Tuesday'] }); // Monday unpreferred

	it('should return violations when preferences are not met', () => {
		const assignment: Assignment = { 'type-1': '101' };
		const violations = checkViolations(
			assignment,
			mockVariables,
			defaultPreferences,
		);
		expect(violations).toContain(
			'Includes full classes (no open seats available)',
		);
		expect(violations).toContain(
			'Some classes are outside your preferred start/end times',
		);
		expect(violations).toContain('Some classes are on your unpreferred days');
	});

	it('should return no violations when all preferences are met', () => {
		const assignment: Assignment = { 'type-1': '102' };
		const violations = checkViolations(
			assignment,
			mockVariables,
			defaultPreferences,
		);
		expect(violations.length).toBe(0);
	});

	it('should report lunch overlap violation', () => {
		const assignment: Assignment = { 'type-1': '102' };
		const violations = checkViolations(
			assignment,
			mockVariables,
			makePrefs({
				preferredDays: ['Tuesday'],
				enableLunch: true,
				lunchStart: '10:00',
				lunchEnd: '11:00',
			}),
		);
		expect(violations).toContain(
			'Some classes overlap with your preferred lunch break',
		);
	});

	it('should report ONLINE mode violation for in-person class', () => {
		const assignment: Assignment = { 'type-1': '102' };
		const violations = checkViolations(
			assignment,
			mockVariables,
			makePrefs({ mode: 'ONLINE', preferredDays: ['Tuesday'] }),
		);
		expect(violations).toContain(
			'Includes classes not matching your preferred mode (Online)',
		);
	});

	it('should report IN_PERSON mode violation for online class', () => {
		const onlineVars: Variable[] = [
			makeVariable('type-1', 'Workshop', [
				{
					number: '101',
					available_seats: '5',
					meetings: [
						makeMeeting('Tuesday', '10:00', '11:00', {
							location: 'online',
							campus: 'Online',
						}),
					],
				},
			]),
		];
		const assignment: Assignment = { 'type-1': '101' };
		const violations = checkViolations(
			assignment,
			onlineVars,
			makePrefs({ mode: 'IN_PERSON' }),
		);
		expect(violations).toContain(
			'Includes classes not matching your preferred mode (In-person)',
		);
	});

	it('should report conflict violation', () => {
		const conflictVars: Variable[] = [
			makeVariable('type-1', 'Workshop', [
				{
					number: '101',
					available_seats: '5',
					meetings: [makeMeeting('Monday', '09:00', '11:00')],
				},
			]),
			makeVariable('type-2', 'Workshop', [
				{
					number: '201',
					available_seats: '5',
					meetings: [makeMeeting('Monday', '10:00', '12:00')],
				},
			]),
		];
		const assignment: Assignment = { 'type-1': '101', 'type-2': '201' };
		const violations = checkViolations(
			assignment,
			conflictVars,
			defaultPreferences,
		);
		expect(violations).toContain('Contains class time conflicts (overlaps)');
	});

	it('should report max-days violation', () => {
		const spreadVars: Variable[] = [
			makeVariable('type-1', 'Workshop', [
				{
					number: '101',
					available_seats: '5',
					meetings: [makeMeeting('Monday', '09:00', '10:00')],
				},
			]),
			makeVariable('type-2', 'Workshop', [
				{
					number: '201',
					available_seats: '5',
					meetings: [makeMeeting('Tuesday', '11:00', '12:00')],
				},
			]),
			makeVariable('type-3', 'Workshop', [
				{
					number: '301',
					available_seats: '5',
					meetings: [makeMeeting('Wednesday', '13:00', '14:00')],
				},
			]),
		];
		const assignment: Assignment = {
			'type-1': '101',
			'type-2': '201',
			'type-3': '301',
		};
		const violations = checkViolations(
			assignment,
			spreadVars,
			makePrefs({ maxDays: 2 }),
		);
		expect(violations.some((v) => v.includes('days'))).toBe(true);
	});

	it('should use translation function when provided', () => {
		const tFn = vi.fn((key: string, opts?: Record<string, string | number>) => {
			const base = key.split('.').pop() ?? key;
			if (opts) {
				let text = base;
				Object.entries(opts).forEach(([k, v]) => {
					text = text.replace(`{{${k}}}`, String(v));
				});
				return text;
			}
			return base;
		});
		const assignment: Assignment = { 'type-1': '101' };
		const violations = checkViolations(
			assignment,
			mockVariables,
			defaultPreferences,
			tFn,
		);
		expect(tFn).toHaveBeenCalled();
		expect(violations.length).toBeGreaterThan(0);
	});

	it('should skip lecture conflict checks when ignoreLectures is true', () => {
		const lectureVars: Variable[] = [
			makeVariable('type-1', 'Lecture', [
				{
					number: '101',
					available_seats: '5',
					meetings: [makeMeeting('Monday', '09:00', '11:00')],
				},
			]),
			makeVariable('type-2', 'Lecture', [
				{
					number: '201',
					available_seats: '5',
					meetings: [makeMeeting('Monday', '10:00', '12:00')],
				},
			]),
		];
		const assignment: Assignment = { 'type-1': '101', 'type-2': '201' };
		const violations = checkViolations(
			assignment,
			lectureVars,
			makePrefs({ ignoreLectures: true }),
		);
		// Conflict between two lectures should be skipped
		expect(violations).not.toContain(
			'Contains class time conflicts (overlaps)',
		);
	});

	it('should handle option with undefined available_seats (not considered full)', () => {
		const noseatsVars: Variable[] = [
			makeVariable('type-1', 'Lecture', [
				{
					number: '101',
					// no available_seats property
					meetings: [makeMeeting('Tuesday', '10:00', '11:00')],
				},
			]),
		];
		const assignment: Assignment = { 'type-1': '101' };
		const violations = checkViolations(
			assignment,
			noseatsVars,
			makePrefs({ preferredDays: ['Tuesday'] }),
		);
		expect(violations).not.toContain(
			'Includes full classes (no open seats available)',
		);
	});

	describe('isLectureMeeting helper function', () => {
		it('should identify lecture-like strings correctly', () => {
			expect(isLectureMeeting('Lecture')).toBe(true);
			expect(isLectureMeeting('Lecture 1')).toBe(true);
			expect(isLectureMeeting('lec')).toBe(true);
			expect(isLectureMeeting('Lec 2')).toBe(true);
			expect(isLectureMeeting('lecture')).toBe(true);
			expect(isLectureMeeting('Seminar')).toBe(true);
			expect(isLectureMeeting('seminar')).toBe(true);
			expect(isLectureMeeting('sem')).toBe(true);
			expect(isLectureMeeting('Sem')).toBe(true);
			expect(isLectureMeeting('Practical')).toBe(false);
			expect(isLectureMeeting('Workshop')).toBe(false);
			expect(isLectureMeeting('')).toBe(false);
			expect(isLectureMeeting(undefined)).toBe(false);
		});
	});

	describe('isOnlineMeeting helper function', () => {
		it('should identify online meetings correctly', () => {
			expect(isOnlineMeeting('online', 'North Terrace')).toBe(true);
			expect(isOnlineMeeting('webcast', 'North Terrace')).toBe(true);
			expect(isOnlineMeeting('Room A', 'Online')).toBe(true);
			expect(isOnlineMeeting('Room B', 'North Terrace')).toBe(false);
			expect(isOnlineMeeting('', '')).toBe(false);
			expect(isOnlineMeeting(undefined, undefined)).toBe(false);
		});
	});

	it('should ignore lecture lunch break overlaps if ignoreLectures is true', () => {
		const lectureVars: Variable[] = [
			makeVariable('type-1', 'Lecture', [
				{
					number: '101',
					available_seats: '5',
					meetings: [makeMeeting('Tuesday', '12:15', '12:45')], // Overlaps 12:00-13:00 lunch
				},
			]),
		];
		const assignment: Assignment = { 'type-1': '101' };
		const prefs = makePrefs({
			preferredDays: ['Tuesday'],
			enableLunch: true,
			lunchStart: '12:00',
			lunchEnd: '13:00',
			ignoreLectures: true,
		});

		const violationsWithIgnore = checkViolations(
			assignment,
			lectureVars,
			prefs,
		);
		expect(violationsWithIgnore).not.toContain(
			'Some classes overlap with your preferred lunch break',
		);

		const violationsWithoutIgnore = checkViolations(assignment, lectureVars, {
			...prefs,
			ignoreLectures: false,
		});
		expect(violationsWithoutIgnore).toContain(
			'Some classes overlap with your preferred lunch break',
		);
	});

	it('should handle ignoreLectures with practical-lecture conflict scoring and violation checks', () => {
		// Meeting 1: Practical (non-lecture)
		// Meeting 2: Lecture
		const vars: Variable[] = [
			makeVariable('type-1', 'Practical', [
				{
					number: '101',
					available_seats: '5',
					meetings: [makeMeeting('Monday', '10:00', '12:00')],
				},
			]),
			makeVariable('type-2', 'Lecture', [
				{
					number: '201',
					available_seats: '5',
					meetings: [makeMeeting('Monday', '11:00', '13:00')],
				},
			]),
		];
		const assignment: Assignment = { 'type-1': '101', 'type-2': '201' };

		// Under checkViolations:
		const violations = checkViolations(
			assignment,
			vars,
			makePrefs({ ignoreLectures: true }),
		);
		expect(violations).not.toContain(
			'Contains class time conflicts (overlaps)',
		);

		// Under evaluateAssignment/solveAutoTimetable:
		const result = solveAutoTimetable(
			vars,
			makePrefs({ ignoreLectures: true }),
		);
		expect(result).toEqual(assignment);
	});

	it('should handle lunch break checks with non-overlapping meetings', () => {
		const vars: Variable[] = [
			makeVariable('type-1', 'Practical', [
				{
					number: '101',
					available_seats: '5',
					meetings: [makeMeeting('Tuesday', '09:00', '10:00')],
				},
			]),
		];
		const assignment: Assignment = { 'type-1': '101' };
		const violations = checkViolations(
			assignment,
			vars,
			makePrefs({
				preferredDays: ['Tuesday'],
				enableLunch: true,
				lunchStart: '12:00',
				lunchEnd: '13:00',
			}),
		);
		expect(violations).not.toContain(
			'Some classes overlap with your preferred lunch break',
		);

		// Also check ignoreLectures true inside solveAutoTimetable lunch scoring loop
		const scoreWithIgnore = solveAutoTimetable(
			[
				makeVariable('type-1', 'Lecture', [
					{
						number: '101',
						available_seats: '5',
						meetings: [makeMeeting('Monday', '12:15', '12:45')],
					},
				]),
			],
			makePrefs({
				enableLunch: true,
				lunchStart: '12:00',
				lunchEnd: '13:00',
				ignoreLectures: true,
			}),
		);
		expect(scoreWithIgnore).toBeDefined();
	});

	it('should handle same-day non-overlapping conflict checks', () => {
		const vars: Variable[] = [
			makeVariable('type-1', 'Practical', [
				{
					number: '101',
					available_seats: '5',
					meetings: [makeMeeting('Tuesday', '09:00', '10:00')],
				},
			]),
			makeVariable('type-2', 'Practical', [
				{
					number: '201',
					available_seats: '5',
					meetings: [makeMeeting('Tuesday', '11:00', '12:00')],
				},
			]),
		];
		const assignment: Assignment = { 'type-1': '101', 'type-2': '201' };
		const violations = checkViolations(
			assignment,
			vars,
			makePrefs({ preferredDays: ['Tuesday'] }),
		);
		expect(violations).not.toContain(
			'Contains class time conflicts (overlaps)',
		);
	});

	it('should support same-day same-time but non-overlapping dates (alternating weeks)', () => {
		const vars: Variable[] = [
			makeVariable('type-1', 'Practical', [
				{
					number: '101',
					available_seats: '5',
					meetings: [
						makeMeeting('Tuesday', '09:00', '10:00', {
							date: { start: '03-01', end: '04-01' },
						}),
					],
				},
			]),
			makeVariable('type-2', 'Practical', [
				{
					number: '201',
					available_seats: '5',
					meetings: [
						makeMeeting('Tuesday', '09:00', '10:00', {
							date: { start: '05-01', end: '06-01' },
						}),
					],
				},
			]),
		];
		const assignment = solveAutoTimetable(vars, makePrefs({}));
		expect(assignment).toEqual({
			'type-1': '101',
			'type-2': '201',
		});

		const violations = checkViolations(assignment || {}, vars, makePrefs({}));
		expect(violations).not.toContain(
			'Contains class time conflicts (overlaps)',
		);
	});

	it('should score same-day same-time alternating classes higher than different-day alternating classes', () => {
		const vars: Variable[] = [
			makeVariable('type-1', 'Practical', [
				{
					number: '101', // Tuesday 9:00 - 10:00, Weeks 1-6
					available_seats: '5',
					meetings: [
						makeMeeting('Tuesday', '09:00', '10:00', {
							date: { start: '03-01', end: '04-01' },
						}),
					],
				},
				{
					number: '102', // Wednesday 9:00 - 10:00, Weeks 1-6
					available_seats: '5',
					meetings: [
						makeMeeting('Wednesday', '09:00', '10:00', {
							date: { start: '03-01', end: '04-01' },
						}),
					],
				},
			]),
			makeVariable('type-2', 'Practical', [
				{
					number: '201', // Tuesday 9:00 - 10:00, Weeks 7-12
					available_seats: '5',
					meetings: [
						makeMeeting('Tuesday', '09:00', '10:00', {
							date: { start: '05-01', end: '06-01' },
						}),
					],
				},
			]),
		];

		const assignment = solveAutoTimetable(vars, makePrefs({}));
		expect(assignment).toEqual({
			'type-1': '101',
			'type-2': '201',
		});
	});

	it('should handle break duration exactly equal to preferred break', () => {
		const vars: Variable[] = [
			makeVariable('type-1', 'Practical', [
				{
					number: '101',
					available_seats: '5',
					meetings: [makeMeeting('Monday', '09:00', '10:00')],
				},
			]),
			makeVariable('type-2', 'Practical', [
				{
					number: '201',
					available_seats: '5',
					meetings: [makeMeeting('Monday', '11:00', '12:00')],
				},
			]),
		];
		// Break duration is exactly 60 minutes = 1 hour.
		const assignment = solveAutoTimetable(
			vars,
			makePrefs({ preferredBreak: 1 }),
		); // 1 hour preferred break
		expect(assignment).toEqual({ 'type-1': '101', 'type-2': '201' });
	});
});
