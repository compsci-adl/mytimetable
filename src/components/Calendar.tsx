import { Button, Tooltip } from '@nextui-org/react';
import clsx from 'clsx';
import { useRef, useState } from 'react';
import { create } from 'zustand';

import { WEEK_DAYS } from '../constants/week-days';
import { YEAR } from '../constants/year';
import { useCourseColor, useEnrolledCourse } from '../data/enrolled-courses';
import { useCalendar, useOtherWeekCourseTimes } from '../helpers/calendar';
import type dayjs from '../lib/dayjs';
import type { WeekCourse } from '../types/course';
import { timeToDayjs } from '../utils/date';
import { useDrag, useDrop } from '../utils/dnd';
import { calcHoursDuration } from '../utils/hours-duration';

type DraggingCourseState = {
	isDragging: boolean;
	course: WeekCourse | null;
	start: (course: WeekCourse) => void;
	stop: () => void;
};
const useDraggingCourse = create<DraggingCourseState>()((set) => ({
	isDragging: false,
	course: null,
	start: (course) => set({ isDragging: true, course }),
	stop: () => set({ isDragging: false, course: null }),
}));

const CourseCard = ({ course }: { course: WeekCourse }) => {
	const color = useCourseColor(course.id);

	const draggingCourse = useDraggingCourse();
	const [isDragging, setIsDragging] = useState(false);
	const ref = useRef<HTMLDivElement | null>(null);
	useDrag(ref, {
		onDragStart: () => {
			setIsDragging(true);
			draggingCourse.start(course);
		},
		onDrop: () => {
			setIsDragging(false);
			draggingCourse.stop();
		},
		getInitialDataForExternal: () => {
			return { 'text/plain': course.classNumber };
		},
	});

	return (
		<div
			ref={ref}
			className={clsx(
				'h-full overflow-hidden rounded-md border-l-3 p-1 text-xs',
				color.border,
				color.bg,
				color.text,
				isDragging ? 'opacity-50' : 'opacity-75',
			)}
		>
			<div className="text-2xs">{course.time.start}</div>
			<div className="font-bold">
				[{course.classType}] {course.name.subject} {course.name.code} -{' '}
				{course.name.title}
			</div>
			<div>{course.location}</div>
		</div>
	);
};

type CalendarHeaderProps = {
	currentWeek: dayjs.Dayjs;
	actions: ReturnType<typeof useCalendar>['actions'];
	status: ReturnType<typeof useCalendar>['status'];
};
const CalendarHeader = ({
	currentWeek,
	actions,
	status,
}: CalendarHeaderProps) => {
	const actionButtons = [
		{
			icon: '⏪',
			description: 'First week',
			action: actions.goToStartWeek,
			disabled: status.isStartWeek,
		},
		{
			icon: '◀️',
			description: 'Previous week',
			action: actions.prevWeek,
			disabled: status.isStartWeek,
		},
		{
			icon: '▶️',
			description: 'Next week',
			action: actions.nextWeek,
			disabled: status.isEndWeek,
		},
		{
			icon: '⏩',
			description: 'Last week',
			action: actions.goToEndWeek,
			disabled: status.isEndWeek,
		},
	];
	return (
		<div className="sticky top-0 z-50 flex items-center justify-between bg-white py-1">
			<h2 className="text-3xl">
				<span className="mr-2 font-bold">
					{/* Month for Wednesday in the week is more accurate than Monday */}
					{currentWeek.add(2, 'day').format('MMMM')}
				</span>
				<span className="font-light">{YEAR}</span>
			</h2>
			<div className="flex">
				{actionButtons.map((a) => (
					<Tooltip content={a.description} key={a.description}>
						<Button
							isIconOnly
							variant="light"
							onClick={a.action}
							disabled={a.disabled}
							className="text-3xl disabled:opacity-50"
						>
							{a.icon}
						</Button>
					</Tooltip>
				))}
			</div>
		</div>
	);
};

const CalendarBg = ({ currentWeek }: { currentWeek: dayjs.Dayjs }) => {
	return (
		<div className="-z-50 grid grid-cols-[2.5rem_repeat(5,_minmax(0,_1fr))] grid-rows-[2.5rem_repeat(30,_minmax(0,_1fr))] border-apple-gray-300">
			<div className="sticky top-12 z-50 col-span-full col-start-2 grid grid-cols-subgrid border-b-1 bg-white">
				{WEEK_DAYS.map((day, i) => (
					<div
						key={day}
						className="flex justify-center gap-1 text-lg font-light"
					>
						<div>{day.slice(0, 3)}</div>
						<div>{currentWeek.add(i, 'day').date()}</div>
					</div>
				))}
			</div>
			{/* FIXME: Remove the last two grid rows for 21:00 */}
			<div className="relative -top-[0.35rem] row-span-full row-start-2 grid grid-cols-subgrid grid-rows-[repeat(15,_minmax(0,_1fr))] pr-2 text-end text-2xs text-apple-gray-500">
				{Array.from({ length: 15 }, (_, i) => (
					<div key={i}>{String(7 + i).padStart(2, '0')}:00</div>
				))}
			</div>
			<div className="col-span-full col-start-2 row-start-2 row-end-[30] grid grid-cols-subgrid grid-rows-subgrid">
				{Array.from({ length: 5 * 28 }, (_, i) => (
					<div
						key={i}
						className={clsx(
							'h-12 border-r-1',
							[5, 6, 7, 8, 9].includes(i % 10) && 'border-b-1',
						)}
					/>
				))}
			</div>
		</div>
	);
};

const getGridRow = (time: string) => {
	const t = timeToDayjs(time);
	return t.hour() * 2 + (t.minute() >= 30 ? 1 : 0) - 13;
};
const CalendarCourses = ({ courses }: { courses: WeekCourse[][] }) => {
	return (
		<div className="absolute left-10 top-10 z-0 grid grid-cols-5 grid-rows-[repeat(28,_minmax(0,_1fr))]">
			{courses.map((dayCourses, i) =>
				dayCourses.map((course, j) => (
					<div
						className="p-[1px]"
						key={course.id + course.classTypeId + j}
						style={{
							gridColumnStart: i + 1,
							gridRowStart: getGridRow(course.time.start),
							gridRowEnd: getGridRow(course.time.end),
							height: calcHoursDuration(course.time) * 6 + 'rem',
							zIndex: 10 - j, // TODO: Remove zIndex after implementing course conflicts #5
						}}
					>
						<CourseCard course={course} />
					</div>
				)),
			)}
		</div>
	);
};

type CourseTimePlaceholderCardProps = {
	courseId: string;
	classNumber: string;
	classTypeId: string;
	location: string;
};
const CourseTimePlaceholderCard = ({
	courseId,
	classNumber,
	classTypeId,
	location,
}: CourseTimePlaceholderCardProps) => {
	const color = useCourseColor(courseId);

	const { updateClass } = useEnrolledCourse(courseId);

	const [isDraggedOver, setIsDraggedOver] = useState(false);
	const ref = useRef<HTMLDivElement | null>(null);
	useDrop(ref, {
		onDragEnter: () => setIsDraggedOver(true),
		onDragLeave: () => setIsDraggedOver(false),
		onDrop: () => {
			setIsDraggedOver(false);
			updateClass({ classTypeId, classNumber });
		},
	});

	return (
		<div
			className={clsx(
				'z-40 flex h-full w-full items-center justify-center rounded-md text-xs',
				color.bg,
				color.text,
				isDraggedOver ? 'opacity-80 brightness-75' : 'opacity-50',
			)}
			ref={ref}
		>
			<div className="text-center">{location}</div>
		</div>
	);
};

const CalendarCourseOtherTimes = ({
	currentWeek,
}: {
	currentWeek: dayjs.Dayjs;
}) => {
	const course = useDraggingCourse((s) => s.course)!;
	const times = useOtherWeekCourseTimes({
		courseId: course.id,
		classTypeId: course.classTypeId,
		currentWeek,
		currentClassNumber: course.classNumber,
	});

	if (times.length === 0) return;
	return (
		<div className="absolute left-10 top-10 z-40 grid grid-cols-5 grid-rows-[repeat(28,_minmax(0,_1fr))]">
			{times.map((dayTimes, i) =>
				dayTimes.map((time, j) => (
					<div
						className="flex gap-[1px] p-[1px]"
						key={`${i}${j}`}
						style={{
							gridColumnStart: i + 1,
							gridRowStart: getGridRow(time.time.start),
							gridRowEnd: getGridRow(time.time.end),
							height: calcHoursDuration(time.time) * 6 + 'rem',
						}}
					>
						{time.classes.map((c) => (
							<CourseTimePlaceholderCard
								key={c.number}
								courseId={course.id}
								classNumber={c.number}
								classTypeId={course.classTypeId}
								location={c.location}
							/>
						))}
					</div>
				)),
			)}
		</div>
	);
};

export const Calendar = () => {
	const { courses, currentWeek, actions, status } = useCalendar();
	const isDragging = useDraggingCourse((s) => s.isDragging);

	return (
		<div>
			<CalendarHeader
				currentWeek={currentWeek}
				actions={actions}
				status={status}
			/>
			<div className="relative">
				<CalendarBg currentWeek={currentWeek} />
				<CalendarCourses courses={courses} />
				{isDragging && <CalendarCourseOtherTimes currentWeek={currentWeek} />}
			</div>
		</div>
	);
};
