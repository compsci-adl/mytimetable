import { vi } from 'vitest';

import { getStartEndWeek, getWeekCourses } from '../../src/helpers/calendar';
import dayjs from '../../src/lib/dayjs';
import type {
	DetailedEnrolledCourse,
	WeekCourses,
} from '../../src/types/course';

vi.hoisted(() => {
	const localStorageStore: Record<string, string> = {};
	const localStorageMock = {
		getItem: (key: string) => localStorageStore[key] || null,
		setItem: (key: string, value: string) => {
			localStorageStore[key] = String(value);
		},
		removeItem: (key: string) => {
			delete localStorageStore[key];
		},
		clear: () => {
			Object.keys(localStorageStore).forEach((key) => {
				delete localStorageStore[key];
			});
		},
	};
	Object.defineProperty(globalThis, 'localStorage', {
		value: localStorageMock,
		writable: true,
	});
	if (typeof window !== 'undefined') {
		Object.defineProperty(window, 'localStorage', {
			value: localStorageMock,
			writable: true,
		});
	}
});

describe('getStartEndWeek', () => {
	it('should return the first date (Monday) of the start and end week', () => {
		const [start, end] = getStartEndWeek([
			{ start: '09-18', end: '10-12' },
			{ start: '11-13', end: '12-01' },
			{ start: '12-12', end: '11-11' },
		]);
		expect(start.format('MM-DD')).toBe('09-16');
		expect(end.format('MM-DD')).toBe('11-25');
	});

	it('should return current Monday if dates list is empty', () => {
		const [start, end] = getStartEndWeek([]);
		expect(start).toBeDefined();
		expect(end).toBeDefined();
	});
});

describe('getWeekCourses', () => {
	it('should return the courses for each day of the week', () => {
		const enrolledCourses: Array<DetailedEnrolledCourse> = [
			{
				id: 'm',
				name: { code: 'm', subject: 'm', title: 'math' },
				classes: [
					{
						type: 'Lecture',
						typeId: 'l',
						classNumber: '1',
						size: '100',
						available_seats: '10',
						meetings: [
							{
								location: 'bragg',
								campus: 'Adelaide City Campus East',
								day: 'Tuesday',
								date: { start: '09-09', end: '09-27' },
								time: { start: '09:00', end: '10:00' },
							},
						],
					},
				],
			},
			{
				id: 'cs',
				name: { code: 'cs', subject: 'cs', title: 'compsci' },
				classes: [
					{
						type: 'Practical',
						typeId: 'p',
						classNumber: '6',
						meetings: [
							{
								location: 'online',
								campus: 'Online',
								day: 'Monday',
								date: { start: '09-09', end: '09-27' },
								time: { start: '17:00', end: '18:00' },
							},
						],
					},
					{
						type: 'Workshop',
						typeId: 'w',
						classNumber: '3',
						meetings: [
							{
								location: 'iw',
								campus: 'Adelaide City Campus East',
								day: 'Friday',
								date: { start: '09-09', end: '09-27' },
								time: { start: '09:00', end: '10:00' },
							},
						],
					},
				],
			},
		];
		const courses = getWeekCourses(dayjs('2024-09-16'), enrolledCourses);
		const expectedRes: WeekCourses = [
			[
				{
					time: { start: '17:00', end: '18:00' },
					courses: [
						{
							id: 'cs',
							name: { code: 'cs', subject: 'cs', title: 'compsci' },
							classTypeId: 'p',
							classType: 'Practical',
							location: 'online',
							campus: 'Online',
							classNumber: '6',
						},
					],
				},
			],
			[
				{
					time: { start: '09:00', end: '10:00' },
					courses: [
						{
							id: 'm',
							name: { code: 'm', subject: 'm', title: 'math' },
							classTypeId: 'l',
							classType: 'Lecture',
							location: 'bragg',
							campus: 'Adelaide City Campus East',
							classNumber: '1',
							size: '100',
							available_seats: '10',
						},
					],
				},
			],
			[],
			[],
			[
				{
					time: { start: '09:00', end: '10:00' },
					courses: [
						{
							id: 'cs',
							name: { code: 'cs', subject: 'cs', title: 'compsci' },
							classTypeId: 'w',
							classType: 'Workshop',
							location: 'iw',
							campus: 'Adelaide City Campus East',
							classNumber: '3',
						},
					],
				},
			],
		];
		expect(courses).toEqual(expectedRes);
	});
	it('should return the courses if course start at the end of the week', () => {
		const enrolledCourses: Array<DetailedEnrolledCourse> = [
			{
				id: 'm',
				name: { code: 'm', subject: 'm', title: 'math' },
				classes: [
					{
						type: 'Lecture',
						typeId: 'l',
						classNumber: '1',
						meetings: [
							{
								location: 'bragg',
								campus: 'Adelaide City Campus East',
								day: 'Friday',
								date: { start: '09-20', end: '10-04' },
								time: { start: '09:00', end: '10:00' },
							},
						],
					},
				],
			},
		];
		const courses = getWeekCourses(dayjs('2024-09-16'), enrolledCourses);
		const expectedRes: WeekCourses = [
			[],
			[],
			[],
			[],
			[
				{
					time: { start: '09:00', end: '10:00' },
					courses: [
						{
							id: 'm',
							name: { code: 'm', subject: 'm', title: 'math' },
							classTypeId: 'l',
							classType: 'Lecture',
							location: 'bragg',
							campus: 'Adelaide City Campus East',
							classNumber: '1',
						},
					],
				},
			],
		];
		expect(courses).toEqual(expectedRes);
	});
	it('should return the courses if course end at the start of the week', () => {
		const enrolledCourses: Array<DetailedEnrolledCourse> = [
			{
				id: 'm',
				name: { code: 'm', subject: 'm', title: 'math' },
				classes: [
					{
						type: 'Lecture',
						typeId: 'l',
						classNumber: '1',
						meetings: [
							{
								location: 'bragg',
								campus: 'Adelaide City Campus East',
								day: 'Monday',
								date: { start: '08-12', end: '09-16' },
								time: { start: '09:00', end: '10:00' },
							},
						],
					},
				],
			},
		];
		const courses = getWeekCourses(dayjs('2024-09-16'), enrolledCourses);
		const expectedRes: WeekCourses = [
			[
				{
					time: { start: '09:00', end: '10:00' },
					courses: [
						{
							id: 'm',
							name: { code: 'm', subject: 'm', title: 'math' },
							classTypeId: 'l',
							classType: 'Lecture',
							location: 'bragg',
							campus: 'Adelaide City Campus East',
							classNumber: '1',
						},
					],
				},
			],
			[],
			[],
			[],
			[],
		];
		expect(courses).toEqual(expectedRes);
	});
	it('should sort courses by start time in a day', () => {
		const enrolledCourses: Array<DetailedEnrolledCourse> = [
			{
				id: 'cs',
				name: { code: 'cs', subject: 'cs', title: 'compsci' },
				classes: [
					{
						type: 'Practical',
						typeId: 'p',
						classNumber: '6',
						meetings: [
							{
								location: 'online',
								campus: 'Online',
								day: 'Monday',
								date: { start: '09-09', end: '09-27' },
								time: { start: '17:00', end: '18:00' },
							},
						],
					},
				],
			},
			{
				id: 'm',
				name: { code: 'm', subject: 'm', title: 'math' },
				classes: [
					{
						type: 'Lecture',
						typeId: 'l',
						classNumber: '1',
						meetings: [
							{
								location: 'bragg',
								campus: 'Adelaide City Campus East',
								day: 'Monday',
								date: { start: '09-09', end: '09-27' },
								time: { start: '09:00', end: '10:00' },
							},
						],
					},
				],
			},
		];
		const courses = getWeekCourses(dayjs('2024-09-16'), enrolledCourses);
		const expectedRes: WeekCourses = [
			[
				{
					time: { start: '09:00', end: '10:00' },
					courses: [
						{
							id: 'm',
							name: { code: 'm', subject: 'm', title: 'math' },
							classTypeId: 'l',
							classType: 'Lecture',
							location: 'bragg',
							campus: 'Adelaide City Campus East',
							classNumber: '1',
						},
					],
				},
				{
					time: { start: '17:00', end: '18:00' },
					courses: [
						{
							id: 'cs',
							name: { code: 'cs', subject: 'cs', title: 'compsci' },
							classTypeId: 'p',
							classType: 'Practical',
							location: 'online',
							campus: 'Online',
							classNumber: '6',
						},
					],
				},
			],
			[],
			[],
			[],
			[],
		];
		expect(courses).toEqual(expectedRes);
	});
	it('should sort courses by duration (longest first) in a day', () => {
		const enrolledCourses: Array<DetailedEnrolledCourse> = [
			{
				id: 'cs',
				name: { code: 'cs', subject: 'cs', title: 'compsci' },
				classes: [
					{
						type: 'Practical',
						typeId: 'p',
						classNumber: '6',
						meetings: [
							{
								location: 'online',
								campus: 'Online',
								day: 'Monday',
								date: { start: '09-09', end: '09-27' },
								time: { start: '09:00', end: '10:00' },
							},
						],
					},
				],
			},
			{
				id: 'm',
				name: { code: 'm', subject: 'm', title: 'math' },
				classes: [
					{
						type: 'Lecture',
						typeId: 'l',
						classNumber: '1',
						meetings: [
							{
								location: 'bragg',
								campus: 'Adelaide City Campus East',
								day: 'Monday',
								date: { start: '09-09', end: '09-27' },
								time: { start: '09:00', end: '12:00' },
							},
						],
					},
				],
			},
		];
		const courses = getWeekCourses(dayjs('2024-09-16'), enrolledCourses);
		const expectedRes: WeekCourses = [
			[
				{
					time: { start: '09:00', end: '12:00' },
					courses: [
						{
							id: 'm',
							name: { code: 'm', subject: 'm', title: 'math' },
							classTypeId: 'l',
							classType: 'Lecture',
							location: 'bragg',
							campus: 'Adelaide City Campus East',
							classNumber: '1',
						},
					],
				},
				{
					time: { start: '09:00', end: '10:00' },
					courses: [
						{
							id: 'cs',
							name: { code: 'cs', subject: 'cs', title: 'compsci' },
							classTypeId: 'p',
							classType: 'Practical',
							location: 'online',
							campus: 'Online',
							classNumber: '6',
						},
					],
				},
			],
			[],
			[],
			[],
			[],
		];
		expect(courses).toEqual(expectedRes);
	});
	it('should combine courses when they have the same time', () => {
		const enrolledCourses: Array<DetailedEnrolledCourse> = [
			{
				id: 'cs',
				name: { code: 'cs', subject: 'cs', title: 'compsci' },
				classes: [
					{
						type: 'Practical',
						typeId: 'p',
						classNumber: '6',
						meetings: [
							{
								location: 'online',
								campus: 'Online',
								day: 'Monday',
								date: { start: '09-09', end: '09-27' },
								time: { start: '09:00', end: '10:00' },
							},
						],
					},
				],
			},
			{
				id: 'm',
				name: { code: 'm', subject: 'm', title: 'math' },
				classes: [
					{
						type: 'Lecture',
						typeId: 'l',
						classNumber: '1',
						meetings: [
							{
								location: 'bragg',
								campus: 'Adelaide City Campus East',
								day: 'Monday',
								date: { start: '09-09', end: '09-27' },
								time: { start: '09:00', end: '10:00' },
							},
						],
					},
				],
			},
		];
		const courses = getWeekCourses(dayjs('2024-09-16'), enrolledCourses);
		const expectedRes: WeekCourses = [
			[
				{
					time: { start: '09:00', end: '10:00' },
					courses: [
						{
							id: 'cs',
							name: { code: 'cs', subject: 'cs', title: 'compsci' },
							classTypeId: 'p',
							classType: 'Practical',
							location: 'online',
							campus: 'Online',
							classNumber: '6',
						},
						{
							id: 'm',
							name: { code: 'm', subject: 'm', title: 'math' },
							classTypeId: 'l',
							classType: 'Lecture',
							location: 'bragg',
							campus: 'Adelaide City Campus East',
							classNumber: '1',
						},
					],
				},
			],
			[],
			[],
			[],
			[],
		];
		expect(courses).toEqual(expectedRes);
	});

	it('should sort two equal-duration slots by start time (aStart.isAfter(bStart) branch)', () => {
		// Three separate time slots on Monday with the same duration (1h) but different start times.
		// Inserted in descending order (latest first) so the sort must move earlier ones up,
		// triggering both the aStart.isBefore(bStart)→-1 and aStart.isAfter(bStart)→1 paths.
		const enrolledCourses: Array<DetailedEnrolledCourse> = [
			{
				id: 'c1',
				name: { code: 'c1', subject: 'c1', title: 'C1' },
				classes: [
					{
						type: 'Lecture',
						typeId: 'l1',
						classNumber: '1',
						meetings: [
							{
								location: 'A',
								campus: 'NT',
								day: 'Monday',
								date: { start: '09-09', end: '09-27' },
								time: { start: '14:00', end: '15:00' },
							},
						],
					},
				],
			},
			{
				id: 'c2',
				name: { code: 'c2', subject: 'c2', title: 'C2' },
				classes: [
					{
						type: 'Lecture',
						typeId: 'l2',
						classNumber: '2',
						meetings: [
							{
								location: 'B',
								campus: 'NT',
								day: 'Monday',
								date: { start: '09-09', end: '09-27' },
								time: { start: '11:00', end: '12:00' },
							},
						],
					},
				],
			},
			{
				id: 'c3',
				name: { code: 'c3', subject: 'c3', title: 'C3' },
				classes: [
					{
						type: 'Lecture',
						typeId: 'l3',
						classNumber: '3',
						meetings: [
							{
								location: 'C',
								campus: 'NT',
								day: 'Monday',
								date: { start: '09-09', end: '09-27' },
								time: { start: '09:00', end: '10:00' },
							},
						],
					},
				],
			},
		];
		const courses = getWeekCourses(dayjs('2024-09-16'), enrolledCourses);
		const mondayCourses = courses[0];
		// Three separate 1h slots, sorted by start time ascending
		expect(mondayCourses.length).toBe(3);
		expect(mondayCourses[0].time.start).toBe('09:00');
		expect(mondayCourses[1].time.start).toBe('11:00');
		expect(mondayCourses[2].time.start).toBe('14:00');
	});

	it('should ignore meeting if it is not in the week date range', () => {
		const enrolledCourses: Array<DetailedEnrolledCourse> = [
			{
				id: 'm',
				name: { code: 'm', subject: 'm', title: 'math' },
				classes: [
					{
						type: 'Lecture',
						typeId: 'l',
						classNumber: '1',
						meetings: [
							{
								location: 'bragg',
								campus: 'North Terrace',
								day: 'Monday',
								date: { start: '10-20', end: '10-25' }, // outside 09-16 week
								time: { start: '09:00', end: '10:00' },
							},
						],
					},
				],
			},
		];
		const courses = getWeekCourses(dayjs('2024-09-16'), enrolledCourses);
		// Should return empty week
		expect(courses).toEqual([[], [], [], [], []]);
	});
});
