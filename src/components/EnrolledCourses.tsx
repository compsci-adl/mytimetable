import { Chip } from '@nextui-org/react';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useEffect } from 'react';

import { getCourse } from '../apis';
import { useCourses } from '../store/courses';

type CourseChipProps = { name: string; id: string; className?: string };
const CourseChip = ({ name, id, className }: CourseChipProps) => {
	const courseQuery = useQuery({
		queryKey: ['course', id] as const,
		queryFn: ({ queryKey }) => getCourse({ id: queryKey[1] }),
	});
	const { removeCourse, addClasses, courses } = useCourses();
	useEffect(() => {
		if (!courseQuery.isSuccess) return;
		const course = courses.find((c) => c.id === id);
		if (course?.classes.length !== 0) return;
		const courseData = courseQuery.data.data;
		addClasses({
			id,
			classes: courseData.class_list.map((c) => ({
				id: c.id,
				classNumber: c.classes[0].number,
			})),
		});
	}, [courseQuery.data, courseQuery.isSuccess]);

	return (
		<Chip
			onClose={() => {
				removeCourse(id);
			}}
			onClick={() => {
				console.log('click', id);
			}}
			className={clsx(
				courseQuery.isPending ? 'cursor-wait' : 'cursor-pointer',
				className,
			)}
		>
			{name}
			{courseQuery.isPending && ' ⏳'}
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
