import { Chip, useDisclosure } from '@nextui-org/react';
import clsx from 'clsx';
import { useState } from 'react';

import { useEnrolledCourses } from '../data/enrolled-courses';
import { useQueryStatus } from '../utils/query-status';
import { CourseModal } from './CourseModal';

type CourseChipProps = {
	name: string;
	id: string;
	onOpenModal: (id: string) => void;
	className?: string;
};
const CourseChip = ({ name, id, onOpenModal, className }: CourseChipProps) => {
	const removeCourse = useEnrolledCourses((s) => s.removeCourse);

	const { isLoading, isError } = useQueryStatus(['course', id]);

	return (
		<Chip
			color="primary"
			variant="bordered"
			onClose={() => {
				removeCourse(id);
			}}
			onClick={() => {
				if (isLoading || isError) return;
				onOpenModal(id);
			}}
			classNames={{
				base: clsx(
					isLoading ? 'cursor-wait' : 'cursor-pointer hover:brightness-125',
					className,
				),
			}}
		>
			{isLoading && '⏳ '}
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
