import { Button, Tooltip } from '@heroui/react';
import clsx from 'clsx';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	FaAngleDoubleLeft,
	FaAngleDoubleRight,
	FaAngleLeft,
	FaAngleRight,
	FaRocket,
} from 'react-icons/fa';

import { WEEK_DAYS } from '../constants/week-days';
import { YEAR } from '../constants/year';
import {
	useCourseColor,
	useDetailedEnrolledCourses,
	useEnrolledCourse,
	useEnrolledCourses,
} from '../data/enrolled-courses';
import { useCalendar, useOtherWeekCourseTimes } from '../helpers/calendar';
import { useCalendarHourHeight } from '../helpers/calendar-hour-height';
import { findConflicts } from '../helpers/conflicts';
import { useDarkMode } from '../helpers/dark-mode';
import { useDraggingCourse } from '../helpers/dragging-course';
import { calcHoursDuration } from '../helpers/hours-duration';
import { useZoom } from '../helpers/zoom';
import type dayjs from '../lib/dayjs';
import type { DateTimeRange, WeekCourse, WeekCourses } from '../types/course';
import { getAccessibleTextColorForCourse } from '../utils/contrast';
import { timeToDayjs } from '../utils/date';
import { useDrop } from '../utils/dnd';
import { ClassModal } from './ClassModal';
import { CourseCard, InvisiblePlaceholder } from './CourseCard';
import { EnrolmentModal } from './EnrolmentModal';

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
			icon: <FaAngleDoubleLeft />,
			description: t('calendar.first-week'),
			action: actions.goToStartWeek,
			disabled: status.isStartWeek,
		},
		{
			icon: <FaAngleLeft />,
			description: t('calendar.previous-week'),
			action: actions.prevWeek,
			disabled: status.isStartWeek,
		},
		{
			icon: <FaAngleRight />,
			description: t('calendar.next-week'),
			action: actions.nextWeek,
			disabled: status.isEndWeek,
		},
		{
			icon: <FaAngleDoubleRight />,
			description: t('calendar.last-week'),
			action: actions.goToEndWeek,
			disabled: status.isEndWeek,
		},
	];
	return (
		<div className="bg-background sticky top-0 z-50 flex h-12 items-center justify-between pb-3">
			<h2 className="mobile:text-xl text-2xl">
				<span className="text-foreground mr-2 font-black">
					{/* Month for Wednesday in the week is more accurate than Monday */}
					{
						(t('calendar.months') as unknown as Array<string>)[
							currentWeek.add(2, 'day').month()
						]
					}
				</span>
				<span className="text-default-500 font-light">{YEAR}</span>
			</h2>
			<div className="flex gap-1">
				{actionButtons.map((a, i) => (
					<Tooltip key={i} delay={0}>
						<Tooltip.Trigger>
							{a.disabled ? (
								<span tabIndex={0} className="inline-flex outline-none">
									<Button
										isIconOnly
										variant="secondary"
										onPress={a.action}
										isDisabled={a.disabled}
										className="bg-default-100 hover:bg-default-200 h-9 w-9 rounded-full text-lg disabled:opacity-30"
									>
										{a.icon}
									</Button>
								</span>
							) : (
								<Button
									isIconOnly
									variant="secondary"
									onPress={a.action}
									isDisabled={a.disabled}
									className="bg-default-100 hover:bg-default-200 h-9 w-9 rounded-full text-lg disabled:opacity-30"
								>
									{a.icon}
								</Button>
							)}
						</Tooltip.Trigger>
						<Tooltip.Content>{a.description}</Tooltip.Content>
					</Tooltip>
				))}
			</div>
		</div>
	);
};

const EndActions = () => {
	const { t } = useTranslation();

	const [isReadyModalOpen, setIsReadyModalOpen] = useState(false);
	return (
		<div className="mt-6 flex w-full items-center justify-center gap-4">
			<Button
				variant="primary"
				size="lg"
				className="flex items-center gap-2 rounded-full font-bold shadow-lg transition-transform hover:scale-105"
				onPress={() => setIsReadyModalOpen(true)}
			>
				<span>{t('calendar.end-actions.ready')}</span>
				<FaRocket />
			</Button>
			<EnrolmentModal
				isOpen={isReadyModalOpen}
				onOpenChange={setIsReadyModalOpen}
			/>
		</div>
	);
};

const CalendarBg = ({ currentWeek }: { currentWeek: dayjs.Dayjs }) => {
	const { t } = useTranslation();

	const blockHeight = useCalendarHourHeight((s) => s.height);

	return (
		<div
			className="-z-50 grid"
			style={{
				gridTemplateColumns: '2.5rem repeat(5, minmax(0, 1fr))',
				gridTemplateRows: '2.5rem repeat(30, minmax(0, 1fr))',
			}}
		>
			<div
				className="border-apple-gray-300 bg-background col-span-full col-start-2 grid grid-cols-subgrid border-b"
				style={{ gridRow: '1 / 2' }}
			>
				{WEEK_DAYS.map((day, i) => (
					<div
						key={day}
						className="text-foreground flex justify-center gap-1 py-1 text-lg font-light"
					>
						<div>
							{
								(t('calendar.week-days') as unknown as Array<string>)[
									WEEK_DAYS.findIndex((d) => d === day)
								]
							}
						</div>
						<div className="font-bold">{currentWeek.add(i, 'day').date()}</div>
					</div>
				))}
			</div>
			<div
				className="text-2xs text-apple-gray-500 relative top-[-0.35rem] grid grid-cols-subgrid grid-rows-15 pr-2 text-end"
				style={{ gridRow: '2 / 32' }}
			>
				{Array.from({ length: 15 }, (_, i) => (
					<div key={i} className="text-default-500">
						{String(7 + i).padStart(2, '0')}:00
					</div>
				))}
			</div>
			<div
				className="col-span-full col-start-2 grid grid-cols-subgrid grid-rows-subgrid"
				style={{ gridRow: '2 / 32' }}
			>
				{Array.from({ length: 5 * 30 }, (_, i) => (
					<div
						key={i}
						className={clsx(
							'border-apple-gray-300 border-r',
							[5, 6, 7, 8, 9].includes(i % 10) && 'border-b',
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

const computeEventColumns = (
	events: Array<{ time: DateTimeRange; key: string }>,
) => {
	const n = events.length;
	const clusters: Array<Array<{ time: DateTimeRange; key: string }>> = [];
	const visited = new Array(n).fill(false);
	const adj: boolean[][] = Array.from({ length: n }, () =>
		new Array(n).fill(false),
	);
	for (let a = 0; a < n; a++) {
		for (let b = a + 1; b < n; b++) {
			if (
				timeToDayjs(events[a].time.start).isBefore(
					timeToDayjs(events[b].time.end),
				) &&
				timeToDayjs(events[b].time.start).isBefore(
					timeToDayjs(events[a].time.end),
				)
			) {
				adj[a][b] = true;
				adj[b][a] = true;
			}
		}
	}
	for (let i = 0; i < n; i++) {
		if (visited[i]) continue;
		const stack = [i];
		const comp: Array<{ time: DateTimeRange; key: string }> = [];
		visited[i] = true;
		while (stack.length > 0) {
			const cur = stack.pop() as number;
			comp.push(events[cur]);
			for (let j = 0; j < n; j++) {
				if (!visited[j] && adj[cur][j]) {
					visited[j] = true;
					stack.push(j);
				}
			}
		}
		clusters.push(comp);
	}

	const result: Record<string, { column: number; columns: number }> = {};
	clusters.forEach((comp) => {
		const sorted = comp.slice().sort((a, b) => {
			const aStart = timeToDayjs(a.time.start);
			const bStart = timeToDayjs(b.time.start);
			if (aStart.isBefore(bStart)) return -1;
			if (aStart.isAfter(bStart)) return 1;
			const aEnd = timeToDayjs(a.time.end);
			const bEnd = timeToDayjs(b.time.end);
			if (aEnd.isBefore(bEnd)) return -1;
			if (aEnd.isAfter(bEnd)) return 1;
			return 0;
		});

		const columnEnds: Array<{ end: string } | null> = [];
		const assignedPerKey: Record<string, number> = {};
		for (const e of sorted) {
			let assigned = -1;
			for (let c = 0; c < columnEnds.length; c++) {
				const end = columnEnds[c]?.end;
				if (
					!end ||
					timeToDayjs(end).isSameOrBefore(timeToDayjs(e.time.start))
				) {
					assigned = c;
					columnEnds[c] = { end: e.time.end };
					break;
				}
			}
			if (assigned === -1) {
				assigned = columnEnds.length;
				columnEnds.push({ end: e.time.end });
			}
			assignedPerKey[e.key] = assigned;
		}
		const columnsCount = columnEnds.length;
		Object.entries(assignedPerKey).forEach(([k, assigned]) => {
			result[k] = { column: assigned, columns: columnsCount };
		});
	});
	return result;
};

const CalendarCourses = ({
	courses: day,
	currentWeek,
	onCourseClick,
}: {
	courses: WeekCourses;
	currentWeek: dayjs.Dayjs;
	onCourseClick?: (course: WeekCourse) => void;
}) => {
	const blockHeight = useCalendarHourHeight((s) => s.height);

	const detailed = useDetailedEnrolledCourses();
	const { conflictsByClassKey } = findConflicts(detailed);

	const [overlappingKeys, setOverlappingKeys] = useState<
		Record<string, boolean>
	>({});
	const isCondensed = Object.values(overlappingKeys).some(Boolean);

	const handleOverlapChange = useCallback((key: string, overlap: boolean) => {
		setOverlappingKeys((prev) => {
			if (prev[key] === overlap) return prev;
			return { ...prev, [key]: overlap };
		});
	}, []);

	// Flatten events so we can handle overlaps between different time ranges
	type Event = {
		course: WeekCourse;
		time: DateTimeRange;
		key: string;
		dayIndex: number;
		j: number;
	};

	const eventsPerDay: Array<Array<Event>> = day.map((times, i) =>
		times.flatMap((time, j) =>
			time.courses.map((course, index) => ({
				course,
				time: time.time,
				key: `${course.id}-${course.classTypeId}-${course.classNumber}-${course.location}-${index}`,
				dayIndex: i,
				j,
			})),
		),
	);

	const [hoveredKey, setHoveredKey] = useState<string | null>(null);
	const courseRefs = useRef<Record<string, HTMLDivElement | null>>({});

	return (
		<div
			className="absolute top-10 left-10 z-0 grid grid-cols-5 grid-rows-30"
			style={{ width: 'calc(100% - 2.5rem)' }}
			onPointerMove={(e) => {
				const { clientX, clientY } = e;
				for (const key of Object.keys(courseRefs.current)) {
					const el = courseRefs.current[key];
					if (!el) continue;
					const r = el.getBoundingClientRect();
					if (
						clientX >= r.left &&
						clientX <= r.right &&
						clientY >= r.top &&
						clientY <= r.bottom
					) {
						if (hoveredKey !== key) setHoveredKey(key);
						return;
					}
				}
				if (hoveredKey !== null) setHoveredKey(null);
			}}
			onPointerLeave={() => setHoveredKey(null)}
		>
			{eventsPerDay.map((events, i) => {
				if (events.length === 0) return null;
				const columnsMap = computeEventColumns(
					events.map((e) => ({ time: e.time, key: e.key })),
				);
				return events.map((evt) => {
					const cols = columnsMap[evt.key] ?? { column: 0, columns: 1 };
					const widthPercent = 100 / cols.columns;
					const leftPercent = cols.column * widthPercent;
					const height = calcHoursDuration(evt.time) * blockHeight + 'rem';
					const baseZ = evt.j ?? 0;
					const z = hoveredKey === evt.key ? 1000 : baseZ;
					return (
						<div
							className="relative w-full p-px"
							key={evt.key}
							onPointerEnter={() => setHoveredKey(evt.key)}
							onPointerLeave={() =>
								setHoveredKey((k) => (k === evt.key ? null : k))
							}
							style={{
								gridColumnStart: i + 1,
								gridRowStart: getGridRow(evt.time.start),
								gridRowEnd: getGridRow(evt.time.end),
								height,
								zIndex: z,
								pointerEvents: 'none',
							}}
						>
							<div
								ref={(el) => {
									courseRefs.current[evt.key] = el;
								}}
								style={{
									position: 'absolute',
									top: 0,
									left: `${leftPercent}%`,
									width: `calc(${widthPercent}% - 1px)`,
									height: '100%',
									pointerEvents: 'auto',
								}}
							>
								<CourseCard
									course={evt.course}
									time={evt.time}
									currentWeek={currentWeek}
									onOpen={onCourseClick}
									hasConflict={(() => {
										const key = `${evt.course.id}|${evt.course.classTypeId}|${evt.course.classNumber}`;
										return (conflictsByClassKey[key] ?? []).length > 0;
									})()}
									isCondensed={isCondensed}
									cardKey={evt.key}
									onOverlapChange={handleOverlapChange}
								/>
							</div>
						</div>
					);
				});
			})}
		</div>
	);
};

type CourseTimePlaceholderCardProps = {
	courseId: string;
	classNumber: string;
	classTypeId: string;
	location: string;
	campus: string;
};
const CourseTimePlaceholderCard = ({
	courseId,
	classNumber,
	classTypeId,
	location,
	campus,
}: CourseTimePlaceholderCardProps) => {
	const color = useCourseColor(courseId);
	const colorIndex =
		useEnrolledCourses(
			(s) => s.courses.find((c) => c.id === courseId)?.color,
		) ?? 0;
	const { isDarkMode } = useDarkMode();
	const textColor = getAccessibleTextColorForCourse(colorIndex, isDarkMode);

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
				'relative z-40 h-full w-full overflow-hidden rounded-2xl border border-dashed border-current/40 pt-4 text-xs',
				color.bg,
				isDraggedOver
					? 'scale-98 opacity-80 brightness-75 transition-transform'
					: 'opacity-50',
			)}
			style={{ color: textColor }}
			ref={ref}
		>
			<div className="absolute top-1/2 w-full -translate-y-1/2 px-1 text-center font-bold">
				{location + ' | ' + campus}
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

	const [hoveredKey, setHoveredKey] = useState<string | null>(null);
	const placeholderRefs = useRef<Record<string, HTMLDivElement | null>>({});
	if (times.length === 0) return;
	const eventsPerDay = times.map((dayTimes) =>
		dayTimes.flatMap((t, j) =>
			t.classes.map((c, index) => ({
				key: `${course.id}-${course.classTypeId}-${c.number}-${c.location}-${index}`,
				time: t.time,
				classInfo: c,
				j,
			})),
		),
	);

	return (
		<div
			className="absolute top-10 left-10 z-40 grid grid-cols-5 grid-rows-30"
			style={{ width: 'calc(100% - 2.5rem)' }}
			onPointerMove={(e) => {
				const { clientX, clientY } = e;
				for (const key of Object.keys(placeholderRefs.current)) {
					const el = placeholderRefs.current[key];
					if (!el) continue;
					const r = el.getBoundingClientRect();
					if (
						clientX >= r.left &&
						clientX <= r.right &&
						clientY >= r.top &&
						clientY <= r.bottom
					) {
						if (hoveredKey !== key) setHoveredKey(key);
						return;
					}
				}
				if (hoveredKey !== null) setHoveredKey(null);
			}}
			onPointerLeave={() => setHoveredKey(null)}
		>
			{eventsPerDay.map((events, i) => {
				if (events.length === 0) return null;
				const columnsMap = computeEventColumns(
					events.map((e) => ({ time: e.time, key: e.key })),
				);
				return events.map((evt) => {
					const cols = columnsMap[evt.key] ?? { column: 0, columns: 1 };
					const widthPercent = 100 / cols.columns;
					const leftPercent = cols.column * widthPercent;
					const height = calcHoursDuration(evt.time) * blockHeight + 'rem';
					const baseZ = evt.j ?? 0;
					const z = hoveredKey === evt.key ? 1000 : baseZ;
					return (
						<div
							key={evt.key}
							className="relative w-full p-px"
							onPointerEnter={() => setHoveredKey(evt.key)}
							onPointerLeave={() =>
								setHoveredKey((k) => (k === evt.key ? null : k))
							}
							style={{
								gridColumnStart: i + 1,
								gridRowStart: getGridRow(evt.time.start),
								gridRowEnd: getGridRow(evt.time.end),
								height,
								zIndex: z,
								pointerEvents: 'none',
							}}
						>
							<div
								ref={(el) => {
									placeholderRefs.current[evt.key] = el;
								}}
								style={{
									position: 'absolute',
									top: 0,
									left: `${leftPercent}%`,
									width: `calc(${widthPercent}% - 1px)`,
									height: '100%',
									pointerEvents: 'auto',
								}}
							>
								<CourseTimePlaceholderCard
									courseId={course.id}
									classNumber={evt.classInfo.number}
									classTypeId={course.classTypeId}
									location={evt.classInfo.location}
									campus={evt.classInfo.campus}
								/>
							</div>
						</div>
					);
				});
			})}
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

	const noCourses = useEnrolledCourses((s) => s.courses.length === 0);

	const [isClassModalOpen, setIsClassModalOpen] = useState(false);
	type SelectedClassState = {
		courseId: string;
		classTypeId: string;
		classNumber: string;
	} | null;
	const [selectedClass, setSelectedClass] = useState<SelectedClassState>(null);

	const onOpenClass = (course: WeekCourse) => {
		setSelectedClass({
			courseId: course.id,
			classTypeId: course.classTypeId,
			classNumber: course.classNumber,
		});
		setIsClassModalOpen(true);
	};

	return (
		<div
			ref={ref}
			className="bg-background border-separator touch-pan-y rounded-3xl border p-6 shadow-md"
		>
			<CalendarHeader
				currentWeek={currentWeek}
				actions={actions}
				status={status}
			/>
			<div className="no-scrollbar relative overflow-x-auto overscroll-x-contain">
				<CalendarBg currentWeek={currentWeek} />
				<CalendarCourses
					courses={courses}
					currentWeek={currentWeek}
					onCourseClick={onOpenClass}
				/>
				{isDragging && <CalendarCourseOtherTimes currentWeek={currentWeek} />}
			</div>
			{!noCourses && <EndActions />}
			{selectedClass && (
				<ClassModal
					isOpen={isClassModalOpen}
					onOpenChange={(open) => {
						setIsClassModalOpen(open);
						if (!open) setSelectedClass(null);
					}}
					courseId={selectedClass.courseId}
					classTypeId={selectedClass.classTypeId}
					classNumber={selectedClass.classNumber}
				/>
			)}
		</div>
	);
};
