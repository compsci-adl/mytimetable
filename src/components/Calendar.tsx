import { Button } from '@nextui-org/react';
import clsx from 'clsx';

import { YEAR } from '../constants/year';
import { useCourseColor } from '../data/enrolled-courses';
import { useCalendar } from '../helpers/calendar';
import type dayjs from '../lib/dayjs';
import type { WeekCourse } from '../types/course';

const CourseCard = ({
	course,
	className,
}: {
	course: WeekCourse;
	className?: string;
}) => {
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
	nextWeek: () => void;
	prevWeek: () => void;
};
const CalendarHeader = ({
	currentWeek,
	nextWeek,
	prevWeek,
}: CalendarHeaderProps) => {
	return (
		<div className="flex items-center justify-between">
			<h2 className="text-3xl">
				<span className="mr-2 font-bold">{currentWeek.format('MMMM')}</span>
				<span className="font-light">{YEAR}</span>
			</h2>
			<div className="flex gap-2 *:text-3xl">
				<Button
					isIconOnly
					variant="light"
					onClick={prevWeek}
					title="Previous week"
				>
					⬅️
				</Button>
				<Button isIconOnly variant="light" onClick={nextWeek} title="Next week">
					➡️
				</Button>
			</div>
		</div>
	);
};

export const Calendar = () => {
	const { courses, currentWeek, nextWeek, prevWeek } = useCalendar();

	return (
		<div>
			<CalendarHeader
				currentWeek={currentWeek}
				nextWeek={nextWeek}
				prevWeek={prevWeek}
			/>
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
