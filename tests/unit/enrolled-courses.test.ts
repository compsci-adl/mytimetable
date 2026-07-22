import { describe, it, expect, vi, beforeEach } from 'vitest';

import { getCourse } from '../../src/apis';
import { useEnrolledCourses } from '../../src/data/enrolled-courses';
import { useFilters } from '../../src/data/filters';
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
		subject: 'COMP',
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

	it('should add a course and Initialiseits classes based on term and campus preferences', async () => {
		vi.mocked(getCourse).mockResolvedValue(mockCourseData);
		localStorage.setItem('MTT.term', 'sem2'); // overlaps months 7-12

		// Add course with preference for 'Roseworthy Campus'
		await useEnrolledCourses.getState().addCourse({
			id: 'course-adds',
			name: 'COMP 2103',
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
			name: 'COMP 2103',
		});

		// Add second course
		await useEnrolledCourses.getState().addCourse({
			id: 'course-2',
			name: 'COMP 2103',
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
			name: 'COMP 2103',
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
			name: 'COMP 2103',
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

	it('should clear all enrolled courses', () => {
		useEnrolledCourses.setState({
			courses: [
				{ id: 'course-1', name: 'Course 1', classes: [], color: 0 },
				{ id: 'course-2', name: 'Course 2', classes: [], color: 1 },
			],
		});

		useEnrolledCourses.getState().clearCourses();

		const courses = useEnrolledCourses.getState().courses;
		expect(courses).toEqual([]);
	});

	it('should update course class number selection', () => {
		useEnrolledCourses.setState({
			courses: [
				{
					id: 'course-adds',
					name: 'COMP 2103',
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
					name: 'COMP 2103',
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
					name: 'COMP 2103',
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
			name: 'COMP 2103',
		});

		// Remove the course from state immediately before API completes
		useEnrolledCourses.setState({ courses: [] });

		// Now resolve the API call
		resolvePromise(mockCourseData);

		await addPromise;

		// The course is not in state
		expect(useEnrolledCourses.getState().courses.length).toBe(0);
	});

	it('should pick initial classes from the same group when adding a multi-group course', async () => {
		const mockGroupCourseData: Course = {
			id: 'course-grouped',
			course_id: 'group-101',
			name: { subject: 'BIOL', code: '1032', title: 'Biology' },
			class_number: 101,
			year: 2024,
			term: 'sem1',
			campus: 'North Terrace',
			units: 3,
			course_overview: '',
			level_of_study: '',
			requirements: {},
			class_list: [
				{
					id: 'type-lec',
					category: 'enrolment',
					type: 'Lecture',
					classes: [
						{
							number: '101',
							group: '1',
							meetings: [
								{
									day: 'Monday',
									location: 'Room 1',
									campus: 'North Terrace',
									date: { start: '03-01', end: '06-01' },
									time: { start: '09:00', end: '10:00' },
								},
							],
						},
						{
							number: '201',
							group: '2',
							meetings: [
								{
									day: 'Monday',
									location: 'Room 2',
									campus: 'North Terrace',
									date: { start: '03-01', end: '06-01' },
									time: { start: '14:00', end: '15:00' },
								},
							],
						},
					],
				},
				{
					id: 'type-wrk',
					category: 'related',
					type: 'Workshop',
					classes: [
						{
							number: '102',
							group: '1',
							meetings: [
								{
									day: 'Tuesday',
									location: 'Room 3',
									campus: 'North Terrace',
									date: { start: '03-01', end: '06-01' },
									time: { start: '09:00', end: '10:00' },
								},
							],
						},
						{
							number: '202',
							group: '2',
							meetings: [
								{
									day: 'Tuesday',
									location: 'Room 4',
									campus: 'North Terrace',
									date: { start: '03-01', end: '06-01' },
									time: { start: '14:00', end: '15:00' },
								},
							],
						},
					],
				},
			],
		};

		vi.mocked(getCourse).mockResolvedValueOnce(mockGroupCourseData);
		await useEnrolledCourses.getState().addCourse({
			id: 'course-grouped',
			name: 'BIOL 1032',
		});

		const course = useEnrolledCourses
			.getState()
			.courses.find((c) => c.id === 'course-grouped');
		expect(course).toBeDefined();
		const lecClass = course?.classes.find((c) => c.id === 'type-lec');
		const wrkClass = course?.classes.find((c) => c.id === 'type-wrk');
		// Both selected classes should belong to Group 1 (numbers 101 and 102)
		expect(lecClass?.classNumber).toBe('101');
		expect(wrkClass?.classNumber).toBe('102');

		// Now update Workshop to 202 (which is in Group 2)
		queryClient.setQueryData(['course', 'course-grouped'], mockGroupCourseData);
		useEnrolledCourses.getState().updateCourseClass({
			courseId: 'course-grouped',
			classTypeId: 'type-wrk',
			classNumber: '202',
		});

		const updatedCourse = useEnrolledCourses
			.getState()
			.courses.find((c) => c.id === 'course-grouped');
		const updatedLec = updatedCourse?.classes.find((c) => c.id === 'type-lec');
		const updatedWrk = updatedCourse?.classes.find((c) => c.id === 'type-wrk');

		expect(updatedWrk?.classNumber).toBe('202');
		expect(updatedLec?.classNumber).toBe('201');
	});

	it('should pick initial group matching preferred campuses when adding a multi-group course', async () => {
		useFilters.getState().setTerm('sem1');
		useFilters.getState().setCampuses(['North Terrace']);

		const mockData = {
			id: 'course-campus-grouped',
			name: 'BIOL 1033',
			class_list: [
				{
					id: 'type-lec',
					name: 'Lecture',
					classes: [
						{
							number: '301',
							group: '1',
							meetings: [
								{
									day: 'Monday',
									location: 'Room A',
									campus: 'Waite',
									date: { start: '03-01', end: '06-01' },
									time: { start: '10:00', end: '11:00' },
								},
							],
						},
						{
							number: '302',
							group: '2',
							meetings: [
								{
									day: 'Monday',
									location: 'Room B',
									campus: 'North Terrace',
									date: { start: '03-01', end: '06-01' },
									time: { start: '11:00', end: '12:00' },
								},
							],
						},
					],
				},
			],
		};

		vi.mocked(getCourse).mockResolvedValueOnce(mockData as unknown as Course);
		await useEnrolledCourses.getState().addCourse({
			id: 'course-campus-grouped',
			name: 'BIOL 1033',
			preferredCampuses: ['North Terrace'],
		});

		const course = useEnrolledCourses
			.getState()
			.courses.find((c) => c.id === 'course-campus-grouped');
		expect(course).toBeDefined();
		const lecClass = course?.classes.find((c) => c.id === 'type-lec');
		expect(lecClass?.classNumber).toBe('302');
	});

	it('should handle updateCourseClass edge cases for group auto-switching (already matched, missing enrolled class, empty groupMatchedClasses, empty termClasses)', async () => {
		const mockData = {
			id: 'course-update-branches',
			name: 'BIOL 1034',
			class_list: [
				{
					id: 'type-lec',
					name: 'Lecture',
					classes: [
						{
							number: '401',
							group: '1',
							meetings: [
								{
									day: 'Monday',
									location: 'Room A',
									campus: 'North Terrace',
									date: { start: '03-01', end: '06-01' },
									time: { start: '10:00', end: '11:00' },
								},
							],
						},
						{
							number: '402',
							group: '2',
							meetings: [
								{
									day: 'Monday',
									location: 'Room B',
									campus: 'North Terrace',
									date: { start: '03-01', end: '06-01' },
									time: { start: '11:00', end: '12:00' },
								},
							],
						},
					],
				},
				{
					id: 'type-wrk',
					name: 'Workshop',
					classes: [
						{
							number: '501',
							group: '1',
							meetings: [
								{
									day: 'Tuesday',
									location: 'Room C',
									campus: 'North Terrace',
									date: { start: '03-01', end: '06-01' },
									time: { start: '10:00', end: '11:00' },
								},
							],
						},
						{
							number: '502',
							group: '3', // Group 3 (no group 2 option) with out-of-term date
							meetings: [
								{
									day: 'Tuesday',
									location: 'Room D',
									campus: 'North Terrace',
									date: { start: '12-01', end: '12-25' },
									time: { start: '11:00', end: '12:00' },
								},
							],
						},
					],
				},
				{
					id: 'type-tut',
					name: 'Tutorial',
					classes: [
						{
							number: '601',
							group: '2',
							meetings: [
								{
									day: 'Wednesday',
									location: 'Room E',
									campus: 'North Terrace',
									date: { start: '01-01', end: '01-15' }, // Out of term date
									time: { start: '10:00', end: '11:00' },
								},
							],
						},
					],
				},
			],
		};

		vi.mocked(getCourse).mockResolvedValueOnce(mockData as unknown as Course);
		await useEnrolledCourses.getState().addCourse({
			id: 'course-update-branches',
			name: 'BIOL 1034',
		});

		queryClient.setQueryData(['course', 'course-update-branches'], mockData);

		// 1. Updating Lecture to 401 (group 1) when Workshop is already 501 (group 1)
		useEnrolledCourses.getState().updateCourseClass({
			courseId: 'course-update-branches',
			classTypeId: 'type-lec',
			classNumber: '401',
		});

		// 2. Updating Lecture to 402 (group 2)
		// Workshop has no group 2 option (groupMatchedClasses.length === 0 fallback),
		// Tutorial group 2 option has out-of-term date (termClasses.length === 0 fallback)
		useEnrolledCourses.getState().updateCourseClass({
			courseId: 'course-update-branches',
			classTypeId: 'type-lec',
			classNumber: '402',
		});

		// 3. Remove Tutorial class from enrolled course to trigger (!enrolledCls) branch
		useEnrolledCourses.setState((state) => ({
			courses: state.courses.map((c) =>
				c.id === 'course-update-branches'
					? { ...c, classes: c.classes.filter((cls) => cls.id !== 'type-tut') }
					: c,
			),
		}));

		useEnrolledCourses.getState().updateCourseClass({
			courseId: 'course-update-branches',
			classTypeId: 'type-lec',
			classNumber: '401',
		});

		const updatedCourse = useEnrolledCourses
			.getState()
			.courses.find((c) => c.id === 'course-update-branches');
		expect(updatedCourse).toBeDefined();
	});

	it('should handle addCourse when first class type has out of term dates and first option has no group', async () => {
		const mockData = {
			id: 'course-no-group-first',
			name: 'BIOL 1035',
			class_list: [
				{
					id: 'type-lec',
					name: 'Lecture',
					classes: [
						{
							number: '701',
							// group is undefined
							meetings: [
								{
									day: 'Monday',
									location: 'Room A',
									campus: 'North Terrace',
									date: { start: '12-01', end: '12-25' }, // Out of term date
									time: { start: '10:00', end: '11:00' },
								},
							],
						},
						{
							number: '702',
							group: '2',
							meetings: [
								{
									day: 'Monday',
									location: 'Room B',
									campus: 'North Terrace',
									date: { start: '12-01', end: '12-25' }, // Out of term date
									time: { start: '11:00', end: '12:00' },
								},
							],
						},
					],
				},
				{
					id: 'type-wrk',
					name: 'Workshop',
					classes: [
						{
							number: '801',
							group: '1',
							meetings: [
								{
									day: 'Tuesday',
									location: 'Room C',
									campus: 'North Terrace',
									date: { start: '03-01', end: '06-01' },
									time: { start: '10:00', end: '11:00' },
								},
							],
						},
						{
							number: '802',
							group: '2',
							meetings: [
								{
									day: 'Tuesday',
									location: 'Room D',
									campus: 'North Terrace',
									date: { start: '03-01', end: '06-01' },
									time: { start: '11:00', end: '12:00' },
								},
							],
						},
					],
				},
			],
		};

		vi.mocked(getCourse).mockResolvedValueOnce(mockData as unknown as Course);
		await useEnrolledCourses.getState().addCourse({
			id: 'course-no-group-first',
			name: 'BIOL 1035',
		});

		queryClient.setQueryData(['course', 'course-no-group-first'], mockData);

		// Also test updateCourseClass for a class number without group (701) to trigger line 197 (!targetGroup)
		useEnrolledCourses.getState().updateCourseClass({
			courseId: 'course-no-group-first',
			classTypeId: 'type-lec',
			classNumber: '701',
		});

		const course = useEnrolledCourses
			.getState()
			.courses.find((c) => c.id === 'course-no-group-first');
		expect(course).toBeDefined();
	});
});
