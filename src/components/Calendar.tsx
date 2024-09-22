import { Button } from '@nextui-org/react';
import clsx from 'clsx';

import { WEEK_DAYS } from '../constants/week-days';
import { YEAR } from '../constants/year';
import { useCourseColor } from '../data/enrolled-courses';
import { useCalendar } from '../helpers/calendar';
import type dayjs from '../lib/dayjs';
import type { WeekCourse } from '../types/course';

type CourseCardProps = {
	course: WeekCourse;
	className?: string;
};
const CourseCard = ({ course, className }: CourseCardProps) => {
	const color = useCourseColor(course.id);

	return (
		<div
			className={clsx(
				'rounded-md border-l-3 p-1 text-xs',
				color.border,
				color.bg,
				color.text,
				className,
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
		{ icon: '⏪', description: 'Start week', action: actions.goToStartWeek },
		{ icon: '◀️', description: 'Previous week', action: actions.prevWeek },
		{ icon: '▶️', description: 'Next week', action: actions.nextWeek },
		{ icon: '⏩', description: 'End week', action: actions.goToEndWeek },
	];
	return (
		<div className="flex items-center justify-between">
			<h2 className="text-3xl">
				<span className="mr-2 font-bold">
					{/* Month for Wednesday in the week is more accurate than Monday */}
					{currentWeek.add(2, 'day').format('MMMM')}
				</span>
				<span className="font-light">{YEAR}</span>
			</h2>
			<div className="flex *:text-3xl">
				{actionButtons.map(({ icon, description, action }) => (
					<Button
						key={description}
						isIconOnly
						variant="light"
						onClick={action}
						title={description}
					>
						{icon}
					</Button>
				))}
			</div>
		</div>
	);
};

export const Calendar = () => {
	const { courses, currentWeek, actions } = useCalendar();

	return (
		<div>
			<CalendarHeader currentWeek={currentWeek} actions={actions} />
			<div className="border-apple-gray-300 grid grid-cols-[auto_repeat(5,_minmax(0,_1fr))] grid-rows-[repeat(31,_minmax(0,_1fr))]">
				<div className="col-span-full col-start-2 grid grid-cols-subgrid border-b-1">
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
				<div className="text-2xs text-apple-gray-500 relative -top-[0.35rem] row-span-full row-start-2 mr-2 grid grid-cols-subgrid grid-rows-[repeat(15,_minmax(0,_1fr))] text-end">
					{Array.from({ length: 15 }, (_, i) => (
						<div key={i}>{String(7 + i).padStart(2, '0')}:00</div>
					))}
				</div>
				<div className="col-span-full col-start-2 row-start-2 row-end-[30] grid grid-cols-subgrid grid-rows-subgrid">
					{Array.from({ length: 5 * 28 }, (_, i) => (
						<div
							key={i}
							className={clsx(
								'h-10 border-r-1',
								[5, 6, 7, 8, 9].includes(i % 10) && 'border-b-1',
							)}
						/>
					))}
				</div>
			</div>
			{Object.entries(courses).map(([day, dayCourses]) => (
				<div key={day}>
					<h2>{day}</h2>
					<div className="flex flex-wrap gap-1 *:basis-1/5">
						{dayCourses.map((c) => (
							<CourseCard course={c} key={c.id + c.classId} />
						))}
					</div>
				</div>
			))}
		</div>
	);
};
