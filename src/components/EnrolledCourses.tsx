import {
	Chip,
	Modal,
	ModalBody,
	ModalContent,
	ModalHeader,
	useDisclosure,
} from '@nextui-org/react';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useEffect, useState } from 'react';

import { getCourse } from '../apis';
import { useCourse } from '../store/course';
import { useCourses } from '../store/courses';

type CourseModalProps = {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	id: string;
};
const CourseModal = ({ isOpen, onOpenChange, id }: CourseModalProps) => {
	const course = useCourse(id);

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
	const isLoading = courseQuery.isPending;

	return (
		<Chip
			color="primary"
			variant="bordered"
			onClose={() => {
				removeCourse(id);
			}}
			onClick={() => {
				if (isLoading) return;
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
			{name}
		</Chip>
	);
};

export const EnrolledCourses = () => {
	const courses = useCourses((s) => s.courses);
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
