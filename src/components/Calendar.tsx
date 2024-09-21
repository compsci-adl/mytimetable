import { Button } from '@nextui-org/react';
import clsx from 'clsx';

import { useCourseColor } from '../data/enrolled-courses';
import { useCalendar } from '../helpers/calendar';
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

export const Calendar = () => {
	const { courses, currentWeek, nextWeek, prevWeek } = useCalendar();

	return (
		<div>
			<h1>{currentWeek.format('MMMM D, YYYY')}</h1>
			<Button
				isIconOnly
				variant="light"
				className="text-2xl"
				onClick={prevWeek}
			>
				⬅️
			</Button>
			<Button
				isIconOnly
				variant="light"
				className="text-2xl"
				onClick={nextWeek}
			>
				➡️
			</Button>
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
