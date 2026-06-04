import { describe, it, expect, vi, beforeEach } from 'vitest';

import { getCourse } from '../../src/apis';
import { useEnrolledCourses } from '../../src/data/enrolled-courses';
import { queryClient } from '../../src/lib/query';
import type { Course } from '../../src/types/course';

// Define localStorage and window mocks globally in Node
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
Object.defineProperty(globalThis, 'window', {
	value: {
		localStorage: localStorageMock,
	},
	writable: true,
});

// Mock getCourse API
vi.mock('../../src/apis', () => ({
	getCourse: vi.fn(),
}));

const mockCourseData = {
	id: 'course-adds',
	course_id: 'adds-123',
	name: {
		subject: 'COMP SCI',
		code: '2103',
		title: 'Algorithm Design & Data Structures',
	},
	class_list: [
		{
			id: 'type-lec',
			category: 'enrolment',
			type: 'Lecture',
			classes: [
				{
					number: '101',
					meetings: [
						{
							day: 'Monday',
							location: 'Room A',
							campus: 'North Terrace',
							date: { start: '07-22', end: '09-09' },
							time: { start: '16:00', end: '17:00' },
						},
					],
				},
				{
					number: '102',
					meetings: [
						{
							day: 'Tuesday',
							location: 'Room B',
							campus: 'Roseworthy Campus',
							date: { start: '07-22', end: '09-09' },
							time: { start: '10:00', end: '11:00' },
						},
					],
				},
			],
		},
		{
			id: 'type-prac',
			category: 'related',
			type: 'Practical',
			classes: [
				{
					number: '201',
					meetings: [
						{
							day: 'Wednesday',
							location: 'Lab A',
							campus: 'North Terrace',
							date: { start: '07-22', end: '09-09' },
							time: { start: '14:00', end: '16:00' },
						},
					],
				},
			],
		},
	],
} as unknown as Course;

describe('useEnrolledCourses Zustand Store', () => {
	beforeEach(() => {
		// Reset Zustand store state and queryClient cache before each test
		useEnrolledCourses.setState({ courses: [] });
		queryClient.clear();
		vi.clearAllMocks();
		localStorage.clear();
	});

	it('should add a course and initialize its classes based on term and campus preferences', async () => {
		vi.mocked(getCourse).mockResolvedValue(mockCourseData);
		localStorage.setItem('MTT.term', 'sem2'); // overlaps months 7-12

		// Add course with preference for 'Roseworthy Campus'
		await useEnrolledCourses.getState().addCourse({
			id: 'course-adds',
			name: 'COMP SCI 2103',
			preferredCampuses: ['Roseworthy Campus'],
		});

		const courses = useEnrolledCourses.getState().courses;
		expect(courses.length).toBe(1);
		expect(courses[0].id).toBe('course-adds');
		expect(courses[0].color).toBe(0);

		// Assert preferred campus was picked (102 for Lecture)
		const lectureClass = courses[0].classes.find((c) => c.id === 'type-lec');
		expect(lectureClass?.classNumber).toBe('102');

		// Assert fallback to first candidate for Practical (201)
		const practicalClass = courses[0].classes.find((c) => c.id === 'type-prac');
		expect(practicalClass?.classNumber).toBe('201');
	});

	it('should assign a new color index when adding a second course', async () => {
		vi.mocked(getCourse).mockResolvedValue(mockCourseData);

		// Add first course
		await useEnrolledCourses.getState().addCourse({
			id: 'course-1',
			name: 'COMP SCI 2103',
		});

		// Add second course
		await useEnrolledCourses.getState().addCourse({
			id: 'course-2',
			name: 'COMP SCI 2103',
		});

		const courses = useEnrolledCourses.getState().courses;
		expect(courses.length).toBe(2);
		expect(courses[0].color).toBe(0);
		expect(courses[1].color).toBe(1);
	});

	it('should fall back to first candidate if preferred campus is not found', async () => {
		vi.mocked(getCourse).mockResolvedValue(mockCourseData);
		localStorage.setItem('MTT.term', 'sem2');

		// Add course with preferred campus that does not match any classes
		await useEnrolledCourses.getState().addCourse({
			id: 'course-adds',
			name: 'COMP SCI 2103',
			preferredCampuses: ['Mawson Lakes'],
		});

		const courses = useEnrolledCourses.getState().courses;
		// Default to first candidates
		const lectureClass = courses[0].classes.find((c) => c.id === 'type-lec');
		expect(lectureClass?.classNumber).toBe('101');
	});

	it('should handle course addition with empty class list safely (crashes prevention)', async () => {
		const emptyClassListCourse = {
			...mockCourseData,
			id: 'course-empty', // Use a different ID to be double sure
			class_list: [
				{
					id: 'type-lec',
					category: 'enrolment',
					type: 'Lecture',
					classes: [], // Empty classes list!
				},
			],
		};
		vi.mocked(getCourse).mockResolvedValue(
			emptyClassListCourse as unknown as Course,
		);

		await useEnrolledCourses.getState().addCourse({
			id: 'course-empty',
			name: 'COMP SCI 2103',
		});

		const courses = useEnrolledCourses.getState().courses;
		expect(courses.length).toBe(1);
		const lectureClass = courses[0].classes.find((c) => c.id === 'type-lec');
		// Should fall back to 'not-available' instead of crashing
		expect(lectureClass?.classNumber).toBe('not-available');
	});

	it('should prevent adding more than 10 courses', async () => {
		// Populate store with 11 dummy courses
		const dummyCourses = Array.from({ length: 11 }, (_, i) => ({
			id: `course-${i}`,
			name: `Dummy ${i}`,
			classes: [],
			color: i % 10,
		}));
		useEnrolledCourses.setState({ courses: dummyCourses });

		await useEnrolledCourses.getState().addCourse({
			id: 'course-12',
			name: 'Exceeding Course',
		});

		// State should remain at 11 courses
		expect(useEnrolledCourses.getState().courses.length).toBe(11);
	});

	it('should remove an enrolled course', () => {
		useEnrolledCourses.setState({
			courses: [
				{ id: 'course-1', name: 'Course 1', classes: [], color: 0 },
				{ id: 'course-2', name: 'Course 2', classes: [], color: 1 },
			],
		});

		useEnrolledCourses.getState().removeCourse('course-1');

		const courses = useEnrolledCourses.getState().courses;
		expect(courses.length).toBe(1);
		expect(courses[0].id).toBe('course-2');
	});

	it('should update course class number selection', () => {
		useEnrolledCourses.setState({
			courses: [
				{
					id: 'course-adds',
					name: 'COMP SCI 2103',
					classes: [{ id: 'type-lec', classNumber: '101' }],
					color: 0,
				},
			],
		});

		useEnrolledCourses.getState().updateCourseClass({
			courseId: 'course-adds',
			classTypeId: 'type-lec',
			classNumber: '102',
		});

		const courses = useEnrolledCourses.getState().courses;
		expect(courses[0].classes[0].classNumber).toBe('102');
	});

	it('should do nothing on updateCourseClass when courseId is not found', () => {
		useEnrolledCourses.setState({
			courses: [
				{
					id: 'course-adds',
					name: 'COMP SCI 2103',
					classes: [{ id: 'type-lec', classNumber: '101' }],
					color: 0,
				},
			],
		});

		// This courseId does not exist — should do nothing
		useEnrolledCourses.getState().updateCourseClass({
			courseId: 'non-existent',
			classTypeId: 'type-lec',
			classNumber: '999',
		});

		// Unchanged
		const courses = useEnrolledCourses.getState().courses;
		expect(courses[0].classes[0].classNumber).toBe('101');
	});

	it('should do nothing on updateCourseClass when classTypeId is not found', () => {
		useEnrolledCourses.setState({
			courses: [
				{
					id: 'course-adds',
					name: 'COMP SCI 2103',
					classes: [{ id: 'type-lec', classNumber: '101' }],
					color: 0,
				},
			],
		});

		// classTypeId does not exist in this course
		useEnrolledCourses.getState().updateCourseClass({
			courseId: 'course-adds',
			classTypeId: 'non-existent-type',
			classNumber: '999',
		});

		// Unchanged
		const courses = useEnrolledCourses.getState().courses;
		expect(courses[0].classes[0].classNumber).toBe('101');
	});

	it('should handle race condition where course is removed before API call completes', async () => {
		let resolvePromise: (value: Course) => void = () => {};
		const promise = new Promise<Course>((resolve) => {
			resolvePromise = resolve;
		});
		vi.mocked(getCourse).mockImplementationOnce(() => promise);

		const addPromise = useEnrolledCourses.getState().addCourse({
			id: 'course-race',
			name: 'COMP SCI 2103',
		});

		// Remove the course from state immediately before API completes
		useEnrolledCourses.setState({ courses: [] });

		// Now resolve the API call
		resolvePromise(mockCourseData);

		await addPromise;

		// The course is not in state
		expect(useEnrolledCourses.getState().courses.length).toBe(0);
	});
});
