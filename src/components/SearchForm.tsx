import {
	Autocomplete,
	AutocompleteItem,
	Button,
	Checkbox,
	Select,
	SelectItem,
} from '@heroui/react';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { getCourses, getSubjects } from '../apis';
import { LocalStorageKey } from '../constants/local-storage-keys';
import { TERMS } from '../constants/terms';
import { YEAR } from '../constants/year';
import { useEnrolledCourses } from '../data/enrolled-courses';
import type { Key } from '../types/key';

export const SearchForm = () => {
	const { t } = useTranslation();

	const enrolledCourses = useEnrolledCourses();

	const [selectedTerm, setSelectedTerm] = useState(
		localStorage.getItem(LocalStorageKey.Term) ?? 'sem1',
	);
	const changeTerm = (term: string) => {
		setSelectedTerm(term);
		localStorage.setItem(LocalStorageKey.Term, term);
	};
	const isTermSelectDisabled = enrolledCourses.courses.length > 0;

	const subjectsQuery = useQuery({
		queryKey: ['subjects', { year: YEAR, term: selectedTerm }] as const,
		queryFn: ({ queryKey }) => getSubjects(queryKey[1]),
	});
	const subjectList =
		subjectsQuery.data?.map((s) => {
			if (typeof s === 'string') {
				return { key: s, code: s, name: s };
			}
			return { key: s.code, code: s.code, name: `${s.code} - ${s.name}` };
		}) ?? [];
	const [subject, setSubject] = useState<string | null>(null);
	const [onlyUniversityWide, setOnlyUniversityWide] = useState<
		boolean | undefined
	>(undefined);
	const [levelOfStudy, setLevelOfStudy] = useState<string | undefined>(
		undefined,
	);

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
	const courseList =
		courses?.map((c) => ({
			key: c.id,
			id: c.id,
			name: `${c.name.code} - ${c.name.title}`,
			university_wide_elective: c.university_wide_elective ?? false,
			course_coordinator: c.course_coordinator ?? '',
			course_overview: c.course_overview ?? '',
			level_of_study: c.level_of_study ?? '',
		})) ?? [];
	const [selectedCourseId, setSelectedCourseId] = useState<Key | null>(null);

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
		});
		setSelectedCourseId(null);
		if (typeof umami !== 'undefined') {
			await umami.track('Add course', { subject: course.name.subject, name });
		}
	};

	return (
		<div>
			<div className="mobile:flex-col flex gap-2">
				<div
					onClick={() => {
						if (!isTermSelectDisabled) return;
						toast.warning(t('toast.drop-to-change-term'));
					}}
				>
					<Select
						label={t('search.select-term')}
						selectedKeys={[selectedTerm]}
						onSelectionChange={(keys) => changeTerm(keys.currentKey!)}
						className="mobile:w-full w-56"
						isDisabled={isTermSelectDisabled}
						disallowEmptySelection
					>
						{TERMS.map((term) => (
							<SelectItem key={term.alias} textValue={term.name}>
								{term.name}
							</SelectItem>
						))}
					</Select>
				</div>
				<Autocomplete
					defaultItems={subjectList}
					label={t('search.choose-subject')}
					className="mobile:w-full w-96"
					selectedKey={subject}
					onSelectionChange={(key) => setSubject(key as string)}
					listboxProps={{ emptyContent: t('search.subject-not-found') }}
				>
					{(subject) => (
						<AutocompleteItem key={subject.key} textValue={subject.name}>
							{subject.name}
						</AutocompleteItem>
					)}
				</Autocomplete>{' '}
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
								<div className="flex items-center justify-between gap-2">
									<div>{course.name}</div>
									{course.university_wide_elective && (
										<div className="text-tiny text-default-500">
											{t('course-modal.university-wide-elective')}
										</div>
									)}
								</div>
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
			</div>
			<div className="flex gap-4">
				<div className="my-4">
					<div className="mb-2 text-sm font-semibold">
						{t('search.level-of-study')}
					</div>
					<div className="flex flex-col gap-2">
						<Checkbox
							checked={levelOfStudy === 'Non-award'}
							isDisabled={
								levelOfStudy !== undefined && levelOfStudy !== 'Non-award'
							}
							onChange={(e) =>
								setLevelOfStudy(e.target.checked ? 'Non-award' : undefined)
							}
						>
							{t('search.level.non-award')}
						</Checkbox>
						<Checkbox
							checked={levelOfStudy === 'Undergraduate'}
							isDisabled={
								levelOfStudy !== undefined && levelOfStudy !== 'Undergraduate'
							}
							onChange={(e) =>
								setLevelOfStudy(e.target.checked ? 'Undergraduate' : undefined)
							}
						>
							{t('search.level.undergraduate')}
						</Checkbox>
						<Checkbox
							checked={levelOfStudy === 'Postgraduate'}
							isDisabled={
								levelOfStudy !== undefined && levelOfStudy !== 'Postgraduate'
							}
							onChange={(e) =>
								setLevelOfStudy(e.target.checked ? 'Postgraduate' : undefined)
							}
						>
							{t('search.level.postgraduate')}
						</Checkbox>
						<Checkbox
							checked={levelOfStudy === 'Research'}
							isDisabled={
								levelOfStudy !== undefined && levelOfStudy !== 'Research'
							}
							onChange={(e) =>
								setLevelOfStudy(e.target.checked ? 'Research' : undefined)
							}
						>
							{t('search.level.research')}
						</Checkbox>
					</div>
				</div>
				<div className="my-4">
					<div className="mb-2 text-sm font-semibold">
						{t('search.courses-availability')}
					</div>
					<div className="flex flex-col gap-2">
						<Checkbox
							checked={onlyUniversityWide === true}
							onChange={(e) =>
								setOnlyUniversityWide(e.target.checked ? true : undefined)
							}
						>
							{t('search.university-wide-elective')}
						</Checkbox>
					</div>
				</div>
			</div>
		</div>
	);
};
