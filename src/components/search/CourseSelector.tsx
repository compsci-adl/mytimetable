import { Label, ComboBox, Input, ListBox, Button } from '@heroui/react';
import { useQuery } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FaSearch, FaTimes } from 'react-icons/fa';

import { getCourses } from '../../apis';
import { YEAR } from '../../constants/year';
import { useEnrolledCourses } from '../../data/enrolled-courses';
import type { Key } from '../../types/key';

interface CourseSelectorProps {
	selectedTerm: string;
	subject: string | null;
	onlyUniversityWide: boolean | undefined;
	levelOfStudy: string | undefined;
	campuses?: string[] | undefined;
}

export const CourseSelector = ({
	selectedTerm,
	subject,
	onlyUniversityWide,
	levelOfStudy,
	campuses,
}: CourseSelectorProps) => {
	const { t } = useTranslation();
	const enrolledCourses = useEnrolledCourses();
	const [selectedCourseId, setSelectedCourseId] = useState<Key | null>(null);
	const [inputValue, setInputValue] = useState('');
	const formRef = useRef<HTMLFormElement>(null);

	const coursesQuery = useQuery({
		queryKey: [
			'courses',
			{
				year: YEAR,
				term: selectedTerm,
				subject: subject!,
				university_wide_elective: onlyUniversityWide,
				level_of_study: levelOfStudy?.toLowerCase(),
			},
		] as const,
		queryFn: ({ queryKey }) => getCourses(queryKey[1]),
		enabled: subject !== null,
	});

	const courses = coursesQuery.data?.courses;
	const filteredByCampus =
		campuses && campuses.length > 0 && courses
			? courses.filter((c) => {
					const courseWithCampus = c as { campus?: string };
					const campusField = courseWithCampus.campus;
					if (!campusField) return false;
					const courseCampuses = campusField.split(',').map((s) => s.trim());
					return courseCampuses.some((cc) => campuses.includes(cc));
				})
			: courses;

	const courseList =
		filteredByCampus?.map((c) => ({
			key: c.id,
			id: c.id,
			name: `${c.name.code} - ${c.name.title}`,
			university_wide_elective: c.university_wide_elective ?? false,
			level_of_study: c.level_of_study ?? '',
		})) ?? [];

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const course = courses?.find((c) => c.id === selectedCourseId);
		if (!course) return;
		const name = `${course.name.code}`;
		enrolledCourses.addCourse({
			name,
			id: course.id,
			preferredCampuses: campuses,
		});
		setSelectedCourseId(null);
		setInputValue('');
		if (typeof umami !== 'undefined') {
			await umami.track('Add course', { subject: course.name.subject, name });
		}
	};

	const disabledKeys = new Set(enrolledCourses.courses.map((c) => c.id));

	const [prevSubject, setPrevSubject] = useState(subject);
	const [prevTerm, setPrevTerm] = useState(selectedTerm);

	if (subject !== prevSubject || selectedTerm !== prevTerm) {
		setPrevSubject(subject);
		setPrevTerm(selectedTerm);
		setSelectedCourseId(null);
		setInputValue('');
	}

	const filteredCourses = courseList.filter((item) =>
		item.name.toLowerCase().includes(inputValue.toLowerCase()),
	);

	const labelText = t('search.search-course') ?? 'Search a course';

	return (
		<form
			ref={formRef}
			className="mobile:flex-row mobile:items-end flex w-full grow flex-col items-stretch gap-2"
			onSubmit={handleSubmit}
		>
			<div className="mobile:w-auto mobile:flex-grow flex w-full flex-col gap-1.5">
				<ComboBox
					selectedKey={selectedCourseId}
					onSelectionChange={(key) => {
						setSelectedCourseId(key as Key | null);
						const selected = courseList.find((c) => c.key === key);
						if (selected) {
							setInputValue(selected.name);
						}
					}}
					inputValue={inputValue}
					onInputChange={(val) => {
						setInputValue(val);
						if (val === '') {
							setSelectedCourseId(null);
						}
					}}
					className="w-full"
					menuTrigger="focus"
					isDisabled={coursesQuery.isPending}
					disabledKeys={disabledKeys}
					items={filteredCourses}
				>
					<Label className="text-foreground/80 pl-1 text-xs leading-normal font-bold">
						{labelText}
					</Label>
					<ComboBox.InputGroup className="border-separator bg-content1 focus-within:ring-primary/20 flex h-11 w-full items-center rounded-2xl border px-4 transition-colors focus-within:ring-2">
						<FaSearch className="text-default-400 mr-3 size-4" />
						<Input
							aria-label={labelText}
							placeholder={labelText}
							className="text-foreground placeholder:text-default-400 h-auto w-full !border-0 !bg-transparent !p-0 !pl-1.5 text-sm !shadow-none focus:!border-0 focus:!bg-transparent focus:!shadow-none focus:!ring-0 focus:!outline-none focus-visible:!outline-none"
						/>
						{inputValue && (
							<Button
								isIconOnly
								variant="tertiary"
								onPress={() => {
									setInputValue('');
									setSelectedCourseId(null);
								}}
								className="text-default-400 hover:text-foreground ml-2 h-auto min-w-0 rounded-full bg-transparent p-0.5 shadow-none transition-colors"
								aria-label="Clear search"
							>
								<FaTimes className="size-4" />
							</Button>
						)}
					</ComboBox.InputGroup>

					<ComboBox.Popover
						placement="bottom start"
						className="bg-content1 border-separator min-w-[280px] rounded-2xl border p-1 shadow-lg"
					>
						<ListBox
							className="max-h-60 overflow-y-auto outline-none"
							items={filteredCourses}
							aria-label="Course suggestions"
							aria-labelledby="course-listbox-label"
							renderEmptyState={() => (
								<div className="text-default-400 p-4 text-center text-xs">
									{t('search.course-not-found')}
								</div>
							)}
						>
							{(item) => (
								<ListBox.Item
									key={item.key}
									id={item.key}
									textValue={item.name}
									className={`focus:bg-default-100 hover:bg-default-100/50 text-foreground cursor-pointer rounded-xl px-3 py-2 transition-colors outline-none ${
										disabledKeys.has(item.id)
											? 'cursor-not-allowed opacity-50'
											: ''
									}`}
								>
									{item.name}
								</ListBox.Item>
							)}
						</ListBox>
					</ComboBox.Popover>
				</ComboBox>
			</div>
			<Button
				variant="primary"
				type="submit"
				isDisabled={!selectedCourseId || coursesQuery.isPending}
				className="mobile:w-auto h-11 w-full rounded-full px-6"
			>
				{t('search.add')}
			</Button>
		</form>
	);
};
