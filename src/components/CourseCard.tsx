import { Button, Tooltip } from '@heroui/react';
import clsx from 'clsx';
import { useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { FaExclamationTriangle, FaPlus, FaThumbtack } from 'react-icons/fa';

import { useCourseColor, useEnrolledCourses } from '../data/enrolled-courses';
import { useOtherWeekCourseTimes } from '../helpers/calendar';
import {
	MAX_HOUR_HEIGHT,
	MIN_HOUR_HEIGHT,
	useCalendarHourHeight,
} from '../helpers/calendar-hour-height';
import { useDarkMode } from '../helpers/dark-mode';
import { useDraggingCourse } from '../helpers/dragging-course';
import type dayjs from '../lib/dayjs';
import type { DateTimeRange, WeekCourse } from '../types/course';
import { getAccessibleTextColorForCourse } from '../utils/contrast';
import { useDrag } from '../utils/dnd';

// FIXME: Fix grid width to remove this placeholder
export const InvisiblePlaceholder = () => {
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
	onOpen?: (course: WeekCourse) => void;
	hasConflict?: boolean;
	isCondensed: boolean;
	cardKey: string;
	onOverlapChange: (key: string, overlap: boolean) => void;
};

export const CourseCard = ({
	course,
	time,
	currentWeek,
	onOpen,
	hasConflict,
	isCondensed,
	cardKey,
	onOverlapChange,
}: CourseCardProps) => {
	const { t } = useTranslation();

	const blockHeight = useCalendarHourHeight((s) => s.height);
	// Track the ratio of the pinch threshold (ranges from 0 at MIN_HOUR_HEIGHT to 1 at MAX_HOUR_HEIGHT)
	const pinchRatio =
		(blockHeight - MIN_HOUR_HEIGHT) / (MAX_HOUR_HEIGHT - MIN_HOUR_HEIGHT);

	const otherTimes = useOtherWeekCourseTimes({
		courseId: course.id,
		classTypeId: course.classTypeId,
		currentWeek,
	});
	const isOnlyTime = !otherTimes.some((times) => times.length !== 0);

	const color = useCourseColor(course.id);
	const colorIndex =
		useEnrolledCourses(
			(s) => s.courses.find((c) => c.id === course.id)?.color,
		) ?? 0;
	const { isDarkMode } = useDarkMode();
	const textColor = getAccessibleTextColorForCourse(colorIndex, isDarkMode);

	const draggingCourse = useDraggingCourse();
	const [isDragging, setIsDragging] = useState(false);
	const ref = useRef<HTMLDivElement | null>(null);
	const measureRef = useRef<HTMLDivElement | null>(null);
	const measureRef1 = useRef<HTMLDivElement | null>(null);
	const measureRef2 = useRef<HTMLDivElement | null>(null);
	const measureRef3 = useRef<HTMLDivElement | null>(null);
	const measureRef4 = useRef<HTMLDivElement | null>(null);

	const [condensedLevel, setCondensedLevel] = useState<number>(1);

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

	useLayoutEffect(() => {
		let active = true;
		const checkOverlap = () => {
			if (!active) return;
			if (!ref.current || !measureRef.current) return;
			const cardHeight = ref.current.clientHeight;
			const neededHeight = measureRef.current.offsetHeight;
			const paddingSafety = 8; // Safety threshold to prevent text clipping at rounded bottom corners
			const overlapping =
				cardHeight > 0 &&
				neededHeight > 0 &&
				cardHeight < neededHeight + paddingSafety;
			onOverlapChange(cardKey, overlapping);

			if (cardHeight > 0) {
				const h2 = measureRef2.current?.offsetHeight || 0;
				const h3 = measureRef3.current?.offsetHeight || 0;
				const h4 = measureRef4.current?.offsetHeight || 0;

				if (h4 > 0 && cardHeight >= h4 + paddingSafety) {
					setCondensedLevel(4);
				} else if (h3 > 0 && cardHeight >= h3 + paddingSafety) {
					setCondensedLevel(3);
				} else if (h2 > 0 && cardHeight >= h2 + paddingSafety) {
					setCondensedLevel(2);
				} else {
					setCondensedLevel(1);
				}
			}
		};

		checkOverlap();

		document.fonts?.ready?.then(() => {
			checkOverlap();
		});

		window.addEventListener('resize', checkOverlap);
		return () => {
			active = false;
			window.removeEventListener('resize', checkOverlap);
			onOverlapChange(cardKey, false);
		};
	}, [blockHeight, cardKey, onOverlapChange]);

	const isFull =
		course.available_seats !== undefined &&
		parseInt(course.available_seats, 10) === 0;

	return (
		<div
			ref={ref}
			data-pinch-ratio={pinchRatio}
			className={clsx(
				'@container h-full overflow-hidden rounded-2xl border-l-3 shadow-sm transition-all duration-200',
				isCondensed ? 'px-1.5 py-1' : 'p-2 @min-[75px]:p-2.5',
				'relative',
				color.border,
				color.bg,
				isDragging ? 'opacity-30' : 'opacity-90 hover:opacity-100',
				hasConflict && 'relative',
			)}
			style={{
				color: textColor,
				outline: hasConflict ? '3px solid #f59e0b' : undefined,
				outlineOffset: hasConflict ? '-3px' : undefined,
			}}
		>
			<div
				ref={measureRef}
				className={clsx(
					'@container w-full overflow-hidden rounded-2xl border-l-3 shadow-sm',
					'p-2 @min-[75px]:p-2.5',
					'pointer-events-none invisible absolute top-0 left-0 opacity-0',
				)}
				style={{
					height: 'auto',
					pointerEvents: 'none',
				}}
			>
				<div className="text-2xs flex justify-between font-medium">
					<div>{time.start}</div>
					<div className="flex items-center gap-1">
						{isOnlyTime && <FaThumbtack className="text-xs opacity-70" />}
					</div>
				</div>
				<div className="mt-0.5 pr-5 text-xs font-extrabold wrap-break-word @min-[75px]:pr-6">
					{course.name.code} - {course.classType}
				</div>
				<div className="text-2xs mt-0.5 line-clamp-1 pr-5 font-medium wrap-break-word opacity-90 @min-[75px]:pr-6">
					{course.name.title}
				</div>
				<div className="text-2xs mt-0.5 pr-5 opacity-90 @min-[75px]:pr-6">
					{course.location} | {course.campus}
				</div>
			</div>

			{/* Hidden progressive condensed measuring containers */}
			<div className="pointer-events-none invisible absolute top-0 left-0 w-full opacity-0">
				{/* Level 1: Code - Class Type */}
				<div
					ref={measureRef1}
					className="w-full border-l-3 px-1.5 py-1"
					style={{ height: 'auto' }}
				>
					<div className="text-2xs flex justify-between pr-5 font-medium @min-[75px]:pr-6">
						<div>{time.start}</div>
						<div className="flex items-center gap-1">
							{isOnlyTime && <FaThumbtack className="text-xs opacity-70" />}
						</div>
					</div>
					<div className="mt-0.5 pr-5 text-xs font-extrabold wrap-break-word @min-[75px]:pr-6">
						{hasConflict && (
							<span className="text-warning mr-1 inline-flex">
								<FaExclamationTriangle />
							</span>
						)}
						{isFull && (
							<span className="text-warning mr-1 inline-flex">
								<FaExclamationTriangle />
							</span>
						)}
						{course.name.code} - {course.classType}
					</div>
				</div>

				{/* Level 2: Code - Class Type + Course Name */}
				<div
					ref={measureRef2}
					className="w-full border-l-3 px-1.5 py-1"
					style={{ height: 'auto' }}
				>
					<div className="text-2xs flex justify-between pr-5 font-medium @min-[75px]:pr-6">
						<div>{time.start}</div>
						<div className="flex items-center gap-1">
							{isOnlyTime && <FaThumbtack className="text-xs opacity-70" />}
						</div>
					</div>
					<div className="mt-0.5 pr-5 text-xs font-extrabold wrap-break-word @min-[75px]:pr-6">
						{hasConflict && (
							<span className="text-warning mr-1 inline-flex">
								<FaExclamationTriangle />
							</span>
						)}
						{isFull && (
							<span className="text-warning mr-1 inline-flex">
								<FaExclamationTriangle />
							</span>
						)}
						{course.name.code} - {course.classType}
					</div>
					<div className="text-2xs mt-0.5 pr-5 font-medium wrap-break-word opacity-90 @min-[75px]:pr-6">
						{course.name.title}
					</div>
				</div>

				{/* Level 3: Code - Class Type + Course Name + Room only */}
				<div
					ref={measureRef3}
					className="w-full border-l-3 px-1.5 py-1"
					style={{ height: 'auto' }}
				>
					<div className="text-2xs flex justify-between pr-5 font-medium @min-[75px]:pr-6">
						<div>{time.start}</div>
						<div className="flex items-center gap-1">
							{isOnlyTime && <FaThumbtack className="text-xs opacity-70" />}
						</div>
					</div>
					<div className="mt-0.5 pr-5 text-xs font-extrabold wrap-break-word @min-[75px]:pr-6">
						{hasConflict && (
							<span className="text-warning mr-1 inline-flex">
								<FaExclamationTriangle />
							</span>
						)}
						{isFull && (
							<span className="text-warning mr-1 inline-flex">
								<FaExclamationTriangle />
							</span>
						)}
						{course.name.code} - {course.classType}
					</div>
					<div className="text-2xs mt-0.5 pr-5 font-medium wrap-break-word opacity-90 @min-[75px]:pr-6">
						{course.name.title}
					</div>
					<div className="text-2xs mt-0.5 pr-5 wrap-break-word opacity-90 @min-[75px]:pr-6">
						{course.location}
					</div>
				</div>

				{/* Level 4: Code - Class Type + Course Name + Full Location */}
				<div
					ref={measureRef4}
					className="w-full border-l-3 px-1.5 py-1"
					style={{ height: 'auto' }}
				>
					<div className="text-2xs flex justify-between pr-5 font-medium @min-[75px]:pr-6">
						<div>{time.start}</div>
						<div className="flex items-center gap-1">
							{isOnlyTime && <FaThumbtack className="text-xs opacity-70" />}
						</div>
					</div>
					<div className="mt-0.5 pr-5 text-xs font-extrabold wrap-break-word @min-[75px]:pr-6">
						{hasConflict && (
							<span className="text-warning mr-1 inline-flex">
								<FaExclamationTriangle />
							</span>
						)}
						{isFull && (
							<span className="text-warning mr-1 inline-flex">
								<FaExclamationTriangle />
							</span>
						)}
						{course.name.code} - {course.classType}
					</div>
					<div className="text-2xs mt-0.5 pr-5 font-medium wrap-break-word opacity-90 @min-[75px]:pr-6">
						{course.name.title}
					</div>
					<div className="text-2xs mt-0.5 pr-5 wrap-break-word opacity-90 @min-[75px]:pr-6">
						{course.location} | {course.campus}
					</div>
				</div>
			</div>

			{isCondensed ? (
				<div className="flex h-full flex-col">
					<div className="text-2xs flex justify-between pr-5 font-medium @min-[75px]:pr-6">
						<div>{time.start}</div>
						<div className="flex items-center gap-1">
							{isOnlyTime && (
								<Tooltip delay={0}>
									<Tooltip.Trigger>
										<div
											tabIndex={0}
											role="img"
											aria-label={t('calendar.immoveable-course')}
											className="outline-none"
										>
											<FaThumbtack className="text-xs opacity-70" />
										</div>
									</Tooltip.Trigger>
									<Tooltip.Content>
										{t('calendar.immoveable-course')}
									</Tooltip.Content>
								</Tooltip>
							)}
						</div>
					</div>
					<div className="mt-0.5 pr-5 text-xs font-extrabold wrap-break-word @min-[75px]:pr-6">
						{hasConflict && (
							<Tooltip delay={0}>
								<Tooltip.Trigger>
									<span
										aria-label="conflict"
										role="img"
										className="text-warning mr-1 inline-flex outline-none"
										tabIndex={0}
									>
										<FaExclamationTriangle />
									</span>
								</Tooltip.Trigger>
								<Tooltip.Content>
									{t('calendar.conflict') ?? 'Conflict with another class'}
								</Tooltip.Content>
							</Tooltip>
						)}
						{isFull && (
							<Tooltip delay={0}>
								<Tooltip.Trigger>
									<span
										aria-label="full"
										role="img"
										className="text-warning mr-1 inline-flex outline-none"
										tabIndex={0}
									>
										<FaExclamationTriangle />
									</span>
								</Tooltip.Trigger>
								<Tooltip.Content>
									{t('calendar.no-available-seats', {
										defaultValue: 'Class full',
									})}
								</Tooltip.Content>
							</Tooltip>
						)}
						{course.name.code} - {course.classType}
					</div>
					{condensedLevel >= 2 && (
						<div className="text-2xs mt-0.5 pr-5 font-medium wrap-break-word opacity-90 @min-[75px]:pr-6">
							{course.name.title}
						</div>
					)}
					{condensedLevel >= 3 && (
						<div className="text-2xs mt-0.5 pr-5 wrap-break-word opacity-90 @min-[75px]:pr-6">
							{condensedLevel === 3
								? course.location
								: `${course.location} | ${course.campus}`}
						</div>
					)}
				</div>
			) : (
				<>
					<div className="text-2xs flex justify-between font-medium">
						<div>{time.start}</div>
						<div className="flex items-center gap-1">
							{isOnlyTime && (
								<Tooltip delay={0}>
									<Tooltip.Trigger>
										<div
											tabIndex={0}
											role="img"
											aria-label={t('calendar.immoveable-course')}
											className="outline-none"
										>
											<FaThumbtack className="text-xs opacity-70" />
										</div>
									</Tooltip.Trigger>
									<Tooltip.Content>
										{t('calendar.immoveable-course')}
									</Tooltip.Content>
								</Tooltip>
							)}
						</div>
					</div>
					<div className="mt-0.5 pr-5 text-xs font-extrabold wrap-break-word @min-[75px]:pr-6">
						{hasConflict && (
							<Tooltip delay={0}>
								<Tooltip.Trigger>
									<span
										aria-label="conflict"
										role="img"
										className="text-warning mr-1 inline-flex outline-none"
										tabIndex={0}
									>
										<FaExclamationTriangle />
									</span>
								</Tooltip.Trigger>
								<Tooltip.Content>
									{t('calendar.conflict') ?? 'Conflict with another class'}
								</Tooltip.Content>
							</Tooltip>
						)}
						{isFull && (
							<Tooltip delay={0}>
								<Tooltip.Trigger>
									<span
										aria-label="full"
										role="img"
										className="text-warning mr-1 inline-flex outline-none"
										tabIndex={0}
									>
										<FaExclamationTriangle />
									</span>
								</Tooltip.Trigger>
								<Tooltip.Content>
									{t('calendar.no-available-seats', {
										defaultValue: 'Class full',
									})}
								</Tooltip.Content>
							</Tooltip>
						)}
						{course.name.code} - {course.classType}
					</div>
					<div className="text-2xs mt-0.5 line-clamp-1 pr-5 font-medium wrap-break-word opacity-90 @min-[75px]:pr-6">
						{course.name.title}
					</div>
					<div className="text-2xs mt-0.5 pr-5 opacity-90 @min-[75px]:pr-6">
						{course.location} | {course.campus}
					</div>
				</>
			)}
			<div className="absolute right-1 bottom-1 z-30 @min-[75px]:right-1.5 @min-[75px]:bottom-1.5">
				<Tooltip delay={0}>
					<Tooltip.Trigger>
						<Button
							isIconOnly
							variant="tertiary"
							size="sm"
							className="flex h-5 w-5 items-center justify-center rounded-full bg-current/10 text-xs font-bold transition-colors hover:bg-current/20 @min-[75px]:h-6 @min-[75px]:w-6 @min-[75px]:text-sm"
							style={{ color: textColor }}
							onPointerDown={(e) => e.stopPropagation()}
							onMouseDown={(e: MouseEvent<HTMLButtonElement>) => {
								e.stopPropagation();
							}}
							onPress={() => {
								if (onOpen) onOpen(course);
							}}
						>
							<FaPlus />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content>{t('calendar.open-class')}</Tooltip.Content>
				</Tooltip>
			</div>
			<InvisiblePlaceholder />
		</div>
	);
};
