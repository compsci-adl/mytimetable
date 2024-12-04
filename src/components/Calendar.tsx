import { Button, Tooltip, useDisclosure } from '@nextui-org/react';
import clsx from 'clsx';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { create } from 'zustand';

import { WEEK_DAYS } from '../constants/week-days';
import { YEAR } from '../constants/year';
import { useCourseColor, useEnrolledCourse } from '../data/enrolled-courses';
import { useCalendar, useOtherWeekCourseTimes } from '../helpers/calendar';
import { useCalendarHourHeight } from '../helpers/calendar-hour-height';
import { useExportCalendar } from '../helpers/export-calendar';
import { calcHoursDuration } from '../helpers/hours-duration';
import { useZoom } from '../helpers/zoom';
import type dayjs from '../lib/dayjs';
import type { DateTimeRange, WeekCourse, WeekCourses } from '../types/course';
import { timeToDayjs } from '../utils/date';
import { useDrag, useDrop } from '../utils/dnd';
import { EnrolmentModal } from './EnrolmentModal';

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

// FIXME: Fix grid width to remove this placeholder
const InvisiblePlaceholder = () => {
	return (
		<div className="invisible">
			PLACEHOLDER DO NOT REMOVE ME AND I AM VERY LOOOOOONG
		</div>
	);
};

type CourseCardProps = {
	course: WeekCourse;
	time: DateTimeRange;
	currentWeek: dayjs.Dayjs;
};
const CourseCard = ({ course, time, currentWeek }: CourseCardProps) => {
	const { t } = useTranslation();

	const otherTimes = useOtherWeekCourseTimes({
		courseId: course.id,
		classTypeId: course.classTypeId,
		currentWeek,
	});
	const isOnlyTime = !otherTimes.some((times) => times.length !== 0);

	const color = useCourseColor(course.id);

	const draggingCourse = useDraggingCourse();
	const [isDragging, setIsDragging] = useState(false);
	const ref = useRef<HTMLDivElement | null>(null);
	useDrag(
		ref,
		{
			canDrag: () => !isOnlyTime,
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
		},
		[isOnlyTime],
	);

	return (
		<div
			ref={ref}
			className={clsx(
				'h-full overflow-hidden rounded-md border-l-3 p-1 text-xs',
				color.border,
				color.bg,
				color.text,
				isDragging ? 'opacity-30' : 'opacity-85',
			)}
		>
			<div className="flex justify-between text-2xs">
				<div>{time.start}</div>
				{isOnlyTime && (
					<Tooltip content={t('calendar.immoveable-course')} size="sm">
						<div>📌</div>
					</Tooltip>
				)}
			</div>
			<div className="font-bold">
				[{course.classType}] {course.name.title}
			</div>
			<div>{course.location}</div>
			<InvisiblePlaceholder />
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
	const { t } = useTranslation();

	const actionButtons = [
		{
			icon: '⏪',
			description: t('calendar.first-week'),
			action: actions.goToStartWeek,
			disabled: status.isStartWeek,
		},
		{
			icon: '◀️',
			description: t('calendar.previous-week'),
			action: actions.prevWeek,
			disabled: status.isStartWeek,
		},
		{
			icon: '▶️',
			description: t('calendar.next-week'),
			action: actions.nextWeek,
			disabled: status.isEndWeek,
		},
		{
			icon: '⏩',
			description: t('calendar.last-week'),
			action: actions.goToEndWeek,
			disabled: status.isEndWeek,
		},
	];
	return (
		<div className="sticky top-0 z-50 flex items-center justify-between bg-background py-1">
			<h2 className="text-3xl mobile:text-2xl">
				<span className="mr-2 font-bold">
					{/* Month for Wednesday in the week is more accurate than Monday */}
					{
						(t('calendar.months') as unknown as Array<string>)[
							currentWeek.add(2, 'day').month()
						]
					}
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

const EndActions = () => {
	const { t } = useTranslation();

	const blockHeight = useCalendarHourHeight((s) => s.height);

	const {
		isOpen: isReadyModalOpen,
		onOpen: onReadyModalOpen,
		onOpenChange: onReadyModalOpenChange,
	} = useDisclosure();
	const { copyText } = useExportCalendar();

	return (
		<div
			className="absolute -bottom-[0.5rem] left-0 flex w-full items-center justify-center gap-4"
			style={{ height: blockHeight + 'rem' }}
		>
			<Tooltip content={t('calendar.end-actions.copy')}>
				<Button
					variant="flat"
					color="primary"
					size="lg"
					isIconOnly
					className="text-2xl"
					onPress={copyText}
				>
					📋
				</Button>
			</Tooltip>
			<Button
				color="primary"
				size="lg"
				className="font-semibold"
				onPress={onReadyModalOpen}
			>
				{t('calendar.end-actions.ready')} 🚀
			</Button>
			<EnrolmentModal
				isOpen={isReadyModalOpen}
				onOpenChange={onReadyModalOpenChange}
			/>
		</div>
	);
};

const CalendarBg = ({ currentWeek }: { currentWeek: dayjs.Dayjs }) => {
	const { t } = useTranslation();

	const blockHeight = useCalendarHourHeight((s) => s.height);

	return (
		<div className="-z-50 grid grid-cols-[2.5rem_repeat(5,_minmax(0,_1fr))] grid-rows-[2.5rem_repeat(30,_minmax(0,_1fr))]">
			<div className="sticky top-12 z-50 col-span-full col-start-2 grid grid-cols-subgrid border-b-1 border-apple-gray-300 bg-background">
				{WEEK_DAYS.map((day, i) => (
					<div
						key={day}
						className="flex justify-center gap-1 text-lg font-light"
					>
						<div>
							{
								(t('calendar.week-days') as unknown as Array<string>)[
									WEEK_DAYS.findIndex((d) => d === day)
								]
							}
						</div>
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
							'border-r-1 border-apple-gray-300',
							[5, 6, 7, 8, 9].includes(i % 10) && 'border-b-1',
						)}
						style={{ height: blockHeight / 2 + 'rem' }}
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
const CalendarCourses = ({
	courses: day,
	currentWeek,
}: {
	courses: WeekCourses;
	currentWeek: dayjs.Dayjs;
}) => {
	const blockHeight = useCalendarHourHeight((s) => s.height);

	return (
		<div className="absolute left-10 top-10 z-0 grid grid-cols-5 grid-rows-[repeat(28,_minmax(0,_1fr))]">
			{day.map((times, i) =>
				times.map((time, j) => (
					<div
						className="flex gap-[1px] p-[1px]"
						key={`${i}${j}`}
						style={{
							gridColumnStart: i + 1,
							gridRowStart: getGridRow(time.time.start),
							gridRowEnd: getGridRow(time.time.end),
							height: calcHoursDuration(time.time) * blockHeight + 'rem',
							zIndex: j, // TODO: Remove zIndex after implementing course conflicts #5
						}}
					>
						{time.courses.map((course) => (
							<CourseCard
								key={course.id + course.classTypeId}
								course={course}
								time={time.time}
								currentWeek={currentWeek}
							/>
						))}
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
				'relative z-40 h-full w-full overflow-hidden rounded-md pt-4 text-xs',
				color.bg,
				color.text,
				isDraggedOver ? 'opacity-80 brightness-75' : 'opacity-50',
			)}
			ref={ref}
		>
			{/* FIXME: Remove placeholder and center the location text by flex */}
			<div className="absolute top-1/2 w-full -translate-y-1/2 text-center">
				{location}
			</div>
			<InvisiblePlaceholder />
		</div>
	);
};

const CalendarCourseOtherTimes = ({
	currentWeek,
}: {
	currentWeek: dayjs.Dayjs;
}) => {
	const blockHeight = useCalendarHourHeight((s) => s.height);

	const course = useDraggingCourse((s) => s.course)!;
	const times = useOtherWeekCourseTimes({
		courseId: course.id,
		classTypeId: course.classTypeId,
		currentWeek,
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
							height: calcHoursDuration(time.time) * blockHeight + 'rem',
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

const WHEEL_SPEED = 0.08;
const PINCH_SPEED = 0.03;
export const Calendar = () => {
	const { courses, currentWeek, actions, status } = useCalendar();
	const isDragging = useDraggingCourse((s) => s.isDragging);

	const ref = useRef<HTMLDivElement | null>(null);
	const setCalendarHeight = useCalendarHourHeight((s) => s.setHeight);
	useZoom({
		ref,
		onWheelZoom: (deltaY) => {
			setCalendarHeight((h) => h - deltaY * WHEEL_SPEED);
		},
		onPinchZoom: (distanceDiff) => {
			setCalendarHeight((h) => h + distanceDiff * PINCH_SPEED);
		},
	});

	return (
		<div ref={ref} className="touch-pan-y">
			<CalendarHeader
				currentWeek={currentWeek}
				actions={actions}
				status={status}
			/>
			<div className="relative">
				<CalendarBg currentWeek={currentWeek} />
				<CalendarCourses courses={courses} currentWeek={currentWeek} />
				{isDragging && <CalendarCourseOtherTimes currentWeek={currentWeek} />}
				<EndActions />
			</div>
		</div>
	);
};
