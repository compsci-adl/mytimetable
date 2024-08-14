import { Chip } from '@nextui-org/react';

import { useCourses } from '../store/courses';

type CourseChipProps = { name: string; id: string; className?: string };
const CourseChip = ({ name, id, className }: CourseChipProps) => {
	const removeCourse = useCourses((s) => s.removeCourse);
	return (
		<Chip
			onClose={() => {
				removeCourse(id);
			}}
			onClick={() => {
				console.log('click', id);
			}}
			className={className}
		>
			{name}
		</Chip>
	);
};

export const EnrolledCourses = () => {
	const courses = useCourses((s) => s.courses);
	return (
		<div className="flex flex-wrap gap-2">
			{courses.map((c) => (
				<CourseChip name={c.name} id={c.id} key={c.id} />
			))}
		</div>
	);
};
