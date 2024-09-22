import { getStartEndWeek, getWeekCourses } from '../src/helpers/calendar';
import dayjs from '../src/lib/dayjs';
import type { DetailedEnrolledCourse, WeekCourses } from '../src/types/course';

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
						id: 'l',
						meetings: [
							{
								location: 'bragg',
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
						id: 'p',
						meetings: [
							{
								location: 'online',
								day: 'Monday',
								date: { start: '09-09', end: '09-27' },
								time: { start: '17:00', end: '18:00' },
							},
						],
					},
					{
						type: 'Workshop',
						id: 'w',
						meetings: [
							{
								location: 'iw',
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
					id: 'cs',
					name: { code: 'cs', subject: 'cs', title: 'compsci' },
					classId: 'p',
					classType: 'Practical',
					location: 'online',
					time: { start: '17:00', end: '18:00' },
				},
			],
			[
				{
					id: 'm',
					name: { code: 'm', subject: 'm', title: 'math' },
					classId: 'l',
					classType: 'Lecture',
					location: 'bragg',
					time: { start: '09:00', end: '10:00' },
				},
			],
			[],
			[],
			[
				{
					id: 'cs',
					name: { code: 'cs', subject: 'cs', title: 'compsci' },
					classId: 'w',
					classType: 'Workshop',
					location: 'iw',
					time: { start: '09:00', end: '10:00' },
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
						id: 'l',
						meetings: [
							{
								location: 'bragg',
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
					id: 'm',
					name: { code: 'm', subject: 'm', title: 'math' },
					classId: 'l',
					classType: 'Lecture',
					location: 'bragg',
					time: { start: '09:00', end: '10:00' },
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
						id: 'l',
						meetings: [
							{
								location: 'bragg',
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
					id: 'm',
					name: { code: 'm', subject: 'm', title: 'math' },
					classId: 'l',
					classType: 'Lecture',
					location: 'bragg',
					time: { start: '09:00', end: '10:00' },
				},
			],
			[],
			[],
			[],
			[],
		];
		expect(courses).toEqual(expectedRes);
	});
});
