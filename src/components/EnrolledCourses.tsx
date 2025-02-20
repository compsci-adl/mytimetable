import { Chip, useDisclosure } from '@heroui/react';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useState } from 'react';

import { getCourse } from '../apis';
import { useCourseColor, useEnrolledCourses } from '../data/enrolled-courses';
import { CourseModal } from './CourseModal';

type CourseChipProps = {
	name: string;
	id: string;
	onOpenModal: (id: string) => void;
};
const CourseChip = ({ name, id, onOpenModal }: CourseChipProps) => {
	const color = useCourseColor(id);
	const removeCourse = useEnrolledCourses((s) => s.removeCourse);

	const { isFetching, isError } = useQuery({
		queryKey: ['course', id],
		queryFn: () => getCourse({ id }),
	});

	return (
		<Chip
			variant="dot"
			onClose={() => {
				removeCourse(id);
			}}
			onClick={() => {
				if (isFetching || isError) return;
				onOpenModal(id);
			}}
			classNames={{
				base: clsx(
					'border-primary text-primary',
					isFetching ? 'cursor-wait' : 'cursor-pointer hover:brightness-125',
				),
				dot: color.dot,
			}}
		>
			{isFetching && '⏳ '}
			{isError && '❌ '}
			{name}
		</Chip>
	);
};

export const EnrolledCourses = () => {
	const courses = useEnrolledCourses((s) => s.courses);
	const [courseModalId, setCourseModalId] = useState<string | null>(null);
	const courseModal = useDisclosure();

	return (
		<>
			<div className="flex flex-wrap gap-2">
				{courses.map((c) => (
					<CourseChip
						name={c.name}
						id={c.id}
						key={c.id}
						onOpenModal={(id) => {
							setCourseModalId(id);
							courseModal.onOpen();
						}}
					/>
				))}
			</div>
			{courseModalId && (
				<CourseModal
					isOpen={courseModal.isOpen}
					onOpenChange={courseModal.onOpenChange}
					id={courseModalId}
				/>
			)}
		</>
	);
};
