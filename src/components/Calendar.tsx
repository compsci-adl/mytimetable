import { Button, Tooltip } from '@nextui-org/react';
import clsx from 'clsx';

import { WEEK_DAYS } from '../constants/week-days';
import { YEAR } from '../constants/year';
import { useCourseColor } from '../data/enrolled-courses';
import { useCalendar } from '../helpers/calendar';
import type dayjs from '../lib/dayjs';
import type { WeekCourse } from '../types/course';
import { timeToDayjs } from '../utils/date';
import { calcDuration } from '../utils/duration';

const CourseCard = ({ course }: { course: WeekCourse }) => {
	const color = useCourseColor(course.id);

	return (
		<div
			className={clsx(
				'h-full rounded-md border-l-3 p-1 text-xs overflow-hidden opacity-75',
				color.border,
				color.bg,
				color.text,
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
};
const CalendarHeader = ({ currentWeek, actions }: CalendarHeaderProps) => {
	const actionButtons = [
		{ icon: '⏪', description: 'First week', action: actions.goToStartWeek },
		{ icon: '◀️', description: 'Previous week', action: actions.prevWeek },
		{ icon: '▶️', description: 'Next week', action: actions.nextWeek },
		{ icon: '⏩', description: 'Last week', action: actions.goToEndWeek },
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
			<div className="flex *:text-3xl">
				{actionButtons.map(({ icon, description, action }) => (
					<Tooltip content={description} key={description}>
						<Button isIconOnly variant="light" onClick={action}>
							{icon}
						</Button>
					</Tooltip>
				))}
			</div>
		</div>
	);
};

const CalendarBg = ({ currentWeek }: { currentWeek: dayjs.Dayjs }) => {
	return (
		<div className="border-apple-gray-300 grid grid-cols-[2.5rem_repeat(5,_minmax(0,_1fr))] grid-rows-[2.5rem_repeat(30,_minmax(0,_1fr))] -z-50">
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
			<div className="text-2xs text-apple-gray-500 relative -top-[0.35rem] row-span-full row-start-2 grid grid-cols-subgrid grid-rows-[repeat(15,_minmax(0,_1fr))] pr-2 text-end">
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
		<div className="absolute left-10 top-10 grid grid-cols-5 grid-rows-[repeat(28,_minmax(0,_1fr))] z-0">
			{courses.map((dayCourses, i) =>
				dayCourses.map((course, j) => (
					<div
						className="p-[1px]"
						key={course.id + course.classTypeId + j}
						style={{
							gridColumnStart: i + 1,
							gridRowStart: getGridRow(course.time.start),
							gridRowEnd: getGridRow(course.time.end),
							height: calcDuration(course.time) * 6 + 'rem',
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

export const Calendar = () => {
	const { courses, currentWeek, actions } = useCalendar();

	return (
		<div>
			<CalendarHeader currentWeek={currentWeek} actions={actions} />
			<div className="relative">
				<CalendarBg currentWeek={currentWeek} />
				<CalendarCourses courses={courses} />
			</div>
		</div>
	);
};
