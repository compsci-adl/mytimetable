import {
	Chip,
	Modal,
	ModalBody,
	ModalContent,
	ModalHeader,
	Select,
	SelectItem,
	useDisclosure,
} from '@nextui-org/react';
import clsx from 'clsx';
import { useState } from 'react';

import { useCourseInfo } from '../data/course-info';
import {
	useEnrolledCourse,
	useEnrolledCourses,
} from '../data/enrolled-courses';
import { useQueryStatus } from '../utils/query-status';

type CourseModalProps = {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	id: string;
};
const CourseModal = ({ isOpen, onOpenChange, id }: CourseModalProps) => {
	const course = useCourseInfo(id);
	const { course: courseData, updateClass } = useEnrolledCourse(id);
	const getSelectedClassNumber = (classTypeId: string) => {
		const selectedClass = courseData?.classes.find((c) => c.id === classTypeId);
		return selectedClass?.classNumber;
	};
	const getSelectedKeys = (selectedClassNumber: string | undefined) => {
		return selectedClassNumber ? [selectedClassNumber] : undefined;
	};

	if (!course) return;
	return (
		<Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
			<ModalContent>
				{() => (
					<>
						<ModalHeader className="flex flex-col gap-1">
							{course.name.subject} {course.name.code} - {course.name.title}
						</ModalHeader>
						<ModalBody as="form" className="mb-4">
							{course.class_list.map((classType) => (
								<Select
									key={classType.id}
									label={`${classType.type} Time`}
									selectedKeys={getSelectedKeys(
										getSelectedClassNumber(classType.id),
									)}
									onSelectionChange={(selectedClassNumber) =>
										updateClass({
											classNumber: [...selectedClassNumber][0] as string,
											classTypeId: classType.id,
										})
									}
								>
									{classType.classes.map((classInfo) => (
										<SelectItem key={classInfo.number}>
											{classInfo.number}
										</SelectItem>
									))}
								</Select>
							))}
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
