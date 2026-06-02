import { describe, it, expect } from 'vitest';

import {
	timeToMinutes,
	timeRangesOverlap,
	solveAutoTimetable,
	checkViolations,
	type Variable,
	type Preferences,
} from '../src/helpers/auto-timetable';

describe('auto-timetable utilities', () => {
	describe('timeToMinutes', () => {
		it('should convert time string to minutes', () => {
			expect(timeToMinutes('00:00')).toBe(0);
			expect(timeToMinutes('09:30')).toBe(570);
			expect(timeToMinutes('21:00')).toBe(1260);
		});
	});

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
});

describe('solveAutoTimetable solver', () => {
	const mockVariables: Variable[] = [
		{
			courseId: 'course-1',
			courseCode: 'TEST1001',
			classTypeId: 'type-1',
			classTypeName: 'Lecture',
			options: [
				{
					number: '101',
					available_seats: '10',
					meetings: [
						{
							day: 'Monday',
							location: 'Room A',
							campus: 'North Terrace',
							date: { start: '03-01', end: '06-01' },
							time: { start: '09:00', end: '11:00' },
						},
					],
				},
				{
					number: '102',
					available_seats: '10',
					meetings: [
						{
							day: 'Tuesday',
							location: 'Room A',
							campus: 'North Terrace',
							date: { start: '03-01', end: '06-01' },
							time: { start: '14:00', end: '16:00' },
						},
					],
				},
			],
		},
		{
			courseId: 'course-1',
			courseCode: 'TEST1001',
			classTypeId: 'type-2',
			classTypeName: 'Practical',
			options: [
				{
					number: '201',
					available_seats: '5',
					meetings: [
						{
							day: 'Monday',
							location: 'Lab A',
							campus: 'North Terrace',
							date: { start: '03-01', end: '06-01' },
							time: { start: '10:00', end: '12:00' }, // Overlaps option 101 on Mon
						},
					],
				},
				{
					number: '202',
					available_seats: '5',
					meetings: [
						{
							day: 'Tuesday',
							location: 'Lab A',
							campus: 'North Terrace',
							date: { start: '03-01', end: '06-01' },
							time: { start: '10:00', end: '12:00' },
						},
					],
				},
			],
		},
	];

	const defaultPreferences: Preferences = {
		earliestStart: '09:00',
		latestEnd: '17:00',
		preferredDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
		preferredBreak: 1,
		maxDays: 5,
		mode: 'HYBRID',
		ignoreLectures: false,
	};

	it('should find a conflict-free solution when one exists', () => {
		const result = solveAutoTimetable(mockVariables, defaultPreferences);
		expect(result).toBeDefined();
		// If 201 overlaps with 101, then we should choose:
		// Either (102, 201) - no overlap (Tuesday Lecture, Monday Practical)
		// Or (102, 202) - no overlap (Tuesday Lecture, Tuesday Practical)
		// Or (101, 202) - no overlap (Monday Lecture, Tuesday Practical)
		// Verify it does not pick (101, 201)
		if (result) {
			const isConflict =
				result['type-1'] === '101' && result['type-2'] === '201';
			expect(isConflict).toBe(false);
		}
	});

	it('should avoid full classes if a non-full alternative exists', () => {
		// Set one of the non-conflicting options to full
		const variablesWithFull = JSON.parse(JSON.stringify(mockVariables));
		variablesWithFull[0].options[1].available_seats = '0'; // 102 is now full

		const result = solveAutoTimetable(variablesWithFull, defaultPreferences);
		expect(result).toBeDefined();
		if (result) {
			// It should pick 101 (since 102 is full), and to avoid conflict it must pick 202
			expect(result['type-1']).toBe('101');
			expect(result['type-2']).toBe('202');
		}
	});

	it('should ignore lecture overlaps if ignoreLectures is true', () => {
		const variablesWithLectureOverlap = JSON.parse(
			JSON.stringify(mockVariables),
		);
		// Force variables to only have overlapping options
		variablesWithLectureOverlap[0].options = [
			variablesWithLectureOverlap[0].options[0], // 101 (Monday 9-11 Lecture)
		];
		variablesWithLectureOverlap[1].options = [
			variablesWithLectureOverlap[1].options[0], // 201 (Monday 10-12 Practical)
		];

		// If ignoreLectures is false, it's a conflict
		const resultConflict = solveAutoTimetable(
			variablesWithLectureOverlap,
			defaultPreferences,
		);
		expect(resultConflict).toBeDefined(); // It will still return since it falls back to best available

		// If ignoreLectures is true, it shouldn't treat it as a hard conflict
		const resultIgnore = solveAutoTimetable(variablesWithLectureOverlap, {
			...defaultPreferences,
			ignoreLectures: true,
		});
		expect(resultIgnore).toEqual({
			'type-1': '101',
			'type-2': '201',
		});
	});
});

describe('checkViolations utility', () => {
	const mockVariables: Variable[] = [
		{
			courseId: 'course-1',
			courseCode: 'TEST1001',
			classTypeId: 'type-1',
			classTypeName: 'Lecture',
			options: [
				{
					number: '101',
					available_seats: '0', // Full class
					meetings: [
						{
							day: 'Monday',
							location: 'Room A',
							campus: 'North Terrace',
							date: { start: '03-01', end: '06-01' },
							time: { start: '08:00', end: '10:00' }, // Starts before 09:00 preferred time
						},
					],
				},
				{
					number: '102',
					available_seats: '10',
					meetings: [
						{
							day: 'Tuesday',
							location: 'Room A',
							campus: 'North Terrace',
							date: { start: '03-01', end: '06-01' },
							time: { start: '10:00', end: '12:00' },
						},
					],
				},
			],
		},
	];

	const defaultPreferences: Preferences = {
		earliestStart: '09:00',
		latestEnd: '17:00',
		preferredDays: ['Tuesday'], // Unpreferred Monday
		preferredBreak: 1,
		maxDays: 5,
		mode: 'HYBRID',
		ignoreLectures: false,
	};

	it('should return violations when preferences are not met', () => {
		const assignment = { 'type-1': '101' };
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
		const assignment = { 'type-1': '102' };
		const violations = checkViolations(
			assignment,
			mockVariables,
			defaultPreferences,
		);
		expect(violations.length).toBe(0);
	});
});
