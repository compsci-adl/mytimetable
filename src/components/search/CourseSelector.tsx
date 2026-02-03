import { Autocomplete, AutocompleteItem, Button } from '@heroui/react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

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

	const coursesQuery = useQuery({
		queryKey: [
			'courses',
			{
				year: YEAR,
				term: selectedTerm,
				subject: subject!,
				university_wide_elective: onlyUniversityWide,
				level_of_study: levelOfStudy,
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

	const courseSearchFilter = (text: string, input: string) => {
		text = text.normalize('NFC');
		const courseName = text.split(' - ')[1];
		const courseAbbr = (
			courseName.match(/[A-Z]/g)?.join('') ?? ''
		).toLowerCase();
		text = text.toLocaleLowerCase();
		input = input.normalize('NFC').toLocaleLowerCase();
		return text.includes(input) || courseAbbr.includes(input);
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const course = courses?.find((c) => c.id === selectedCourseId);
		if (!course) return;
		const name = `$${course.name.code}`;
		enrolledCourses.addCourse({
			name,
			id: course.id,
			preferredCampuses: campuses,
		});
		setSelectedCourseId(null);
		if (typeof umami !== 'undefined') {
			await umami.track('Add course', { subject: course.name.subject, name });
		}
	};

	return (
		<form
			className="mobile:flex-col flex grow items-center gap-2"
			onSubmit={handleSubmit}
		>
			<Autocomplete
				label={t('search.search-course')}
				isDisabled={coursesQuery.isPending}
				defaultItems={courseList}
				selectedKey={selectedCourseId}
				onSelectionChange={setSelectedCourseId}
				disabledKeys={enrolledCourses.courses.map((c) => c.id)}
				listboxProps={{ emptyContent: t('search.course-not-found') }}
				defaultFilter={courseSearchFilter}
			>
				{(course) => (
					<AutocompleteItem key={course.key} textValue={course.name}>
						<div>{course.name}</div>
					</AutocompleteItem>
				)}
			</Autocomplete>
			<Button
				color="primary"
				type="submit"
				isDisabled={!selectedCourseId}
				className="mobile:w-full"
			>
				{t('search.add')}
			</Button>
		</form>
	);
};
