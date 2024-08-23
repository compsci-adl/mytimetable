import {
	Chip,
	Modal,
	ModalBody,
	ModalContent,
	ModalHeader,
	useDisclosure,
} from '@nextui-org/react';
import clsx from 'clsx';
import { useState } from 'react';

import { useCourseInfo } from '../data/course-info';
import { useEnrolledCourses } from '../data/enrolled-courses';
import { useQueryStatus } from '../utils/query-status';

type CourseModalProps = {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	id: string;
};
const CourseModal = ({ isOpen, onOpenChange, id }: CourseModalProps) => {
	const course = useCourseInfo(id);

	if (!course) return;
	return (
		<Modal isOpen={isOpen} onOpenChange={onOpenChange}>
			<ModalContent>
				{() => (
					<>
						<ModalHeader className="flex flex-col gap-1">
							{course.name.subject} {course.name.code} - {course.name.title}
						</ModalHeader>
						<ModalBody>
							<p>Nothing for now</p>
						</ModalBody>
					</>
				)}
			</ModalContent>
		</Modal>
	);
};

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
