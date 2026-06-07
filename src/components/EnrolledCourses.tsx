import { Tooltip, CloseButton } from '@heroui/react';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useState } from 'react';
import {
	FaExclamationTriangle,
	FaExternalLinkAlt,
	FaSpinner,
	FaTimes,
} from 'react-icons/fa';

import { getCourse } from '../apis';
import { useGetCourseInfo } from '../data/course-info';
import { useCourseColor, useEnrolledCourses } from '../data/enrolled-courses';
import { useDetailedEnrolledCourses } from '../data/enrolled-courses';
import { findConflicts } from '../helpers/conflicts';
import { CourseModal } from './CourseModal';

type CourseChipProps = {
	name: string;
	id: string;
	onOpenModal: (id: string) => void;
};
const CourseChip = ({ name, id, onOpenModal }: CourseChipProps) => {
	const color = useCourseColor(id);
	const courseInfo = useGetCourseInfo(id);
	const enrolledCourse = useEnrolledCourses((s) =>
		s.courses.find((c) => c.id === id),
	);

	const detailed = useDetailedEnrolledCourses();
	const { courseHasConflict } = findConflicts(detailed);

	const hasPersistedNoClasses = Boolean(
		enrolledCourse &&
		Array.isArray(enrolledCourse.classes) &&
		enrolledCourse.classes.length === 0,
	);
	const hasCourseInfo = courseInfo !== null;
	const classList = courseInfo?.class_list ?? [];
	const hasAnyClass = classList.some(
		(ct) => Array.isArray(ct.classes) && ct.classes.length > 0,
	);
	const isEmpty = hasPersistedNoClasses || (hasCourseInfo && !hasAnyClass);
	const removeCourse = useEnrolledCourses((s) => s.removeCourse);

	const { isFetching, isError } = useQuery({
		queryKey: ['course', id],
		queryFn: () => getCourse({ id }),
	});

	return (
		<button
			type="button"
			className={clsx(
				'border-tiger/25 bg-tiger/5 dark:border-tiger/35 dark:bg-tiger/10 text-foreground focus-visible:ring-tiger flex items-center gap-1.5 rounded-full border py-1 pr-1.5 pl-2.5 text-sm font-semibold shadow-sm transition-all duration-200 outline-none focus-visible:ring-2',
				isFetching
					? 'cursor-wait'
					: 'hover:border-tiger/50 hover:bg-tiger/10 dark:hover:border-tiger/50 dark:hover:bg-tiger/20 cursor-pointer',
			)}
			onClick={() => {
				if (isError) return;
				onOpenModal(id);
			}}
		>
			<span className={clsx('h-2.5 w-2.5 shrink-0 rounded-full', color.dot)} />

			{isFetching && <FaSpinner className="text-primary inline animate-spin" />}
			{isError && <FaTimes className="text-danger inline" />}
			{isEmpty && <FaExclamationTriangle className="text-warning inline" />}

			{courseHasConflict[id] && (
				<Tooltip delay={0}>
					<Tooltip.Trigger>
						<span aria-hidden className="text-warning mr-1 flex items-center">
							<FaExclamationTriangle />
						</span>
					</Tooltip.Trigger>
					<Tooltip.Content>
						This course conflicts with another enrolled course
					</Tooltip.Content>
				</Tooltip>
			)}

			<span className="text-sm font-semibold">{name}</span>

			{courseInfo?.url && (
				<span
					className="hover:bg-default-200 text-default-500 hover:text-foreground ml-1.5 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full transition-colors"
					onClick={(e) => {
						e.stopPropagation();
						window.open(courseInfo.url, '_blank', 'noopener,noreferrer');
					}}
				>
					<FaExternalLinkAlt className="text-2xs" />
				</span>
			)}

			<CloseButton
				aria-label="Remove course"
				onClick={(e) => {
					e.stopPropagation();
					removeCourse(id);
				}}
				className="hover:bg-tiger/15 hover:text-tiger ml-1 h-5 w-5 rounded-full transition-colors"
			/>
		</button>
	);
};

export const EnrolledCourses = () => {
	const courses = useEnrolledCourses((s) => s.courses);
	const [courseModalId, setCourseModalId] = useState<string | null>(null);
	const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);

	return (
		<>
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="flex flex-wrap gap-2">
					{courses.map((c) => {
						// Remove `$` from names
						const sanitizedName = c.name.replace(/\$/g, '');
						return (
							<CourseChip
								name={sanitizedName}
								id={c.id}
								key={c.id}
								onOpenModal={(id) => {
									setCourseModalId(id);
									setIsCourseModalOpen(true);
								}}
							/>
						);
					})}
				</div>
			</div>
			{courseModalId && (
				<CourseModal
					isOpen={isCourseModalOpen}
					onOpenChange={setIsCourseModalOpen}
					id={courseModalId}
				/>
			)}
		</>
	);
};
