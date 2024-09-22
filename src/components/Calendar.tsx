import { Button } from '@nextui-org/react';
import clsx from 'clsx';

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
