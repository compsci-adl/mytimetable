import { Chip, useDisclosure } from '@nextui-org/react';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useState } from 'react';

import { getCourse } from '../apis';
import { useEnrolledCourses } from '../data/enrolled-courses';
import { CourseModal } from './CourseModal';

type CourseChipProps = {
	name: string;
	id: string;
	onOpenModal: (id: string) => void;
	className?: string;
};
const CourseChip = ({ name, id, onOpenModal, className }: CourseChipProps) => {
	const removeCourse = useEnrolledCourses((s) => s.removeCourse);

	const { isFetching, isError } = useQuery({
		queryKey: ['course', id],
		queryFn: () => getCourse({ id }),
	});

	return (
		<Chip
			color="primary"
			variant="bordered"
			onClose={() => {
				removeCourse(id);
			}}
			onClick={() => {
				if (isFetching || isError) return;
				onOpenModal(id);
			}}
			classNames={{
				base: clsx(
					isFetching ? 'cursor-wait' : 'cursor-pointer hover:brightness-125',
					className,
				),
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
