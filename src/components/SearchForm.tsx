import {
	Autocomplete,
	AutocompleteItem,
	Button,
	Checkbox,
	Chip,
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerBody,
	DrawerFooter,
	Select,
	SelectItem,
} from '@heroui/react';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
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
	const [isMobile, setIsMobile] = useState(false);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [tempLevelOfStudy, setTempLevelOfStudy] = useState<string | undefined>(
		undefined,
	);
	const [tempOnlyUniversityWide, setTempOnlyUniversityWide] = useState<
		boolean | undefined
	>(undefined);

	useEffect(() => {
		const updateIsMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};
		updateIsMobile();
		window.addEventListener('resize', updateIsMobile);
		return () => window.removeEventListener('resize', updateIsMobile);
	}, []);

	const handleDrawerChange = (open: boolean) => {
		setIsDrawerOpen(open);
		if (open) {
			setTempLevelOfStudy(levelOfStudy);
			setTempOnlyUniversityWide(onlyUniversityWide);
		} else {
			setTempLevelOfStudy(levelOfStudy);
			setTempOnlyUniversityWide(onlyUniversityWide);
		}
	};

	const clearFilters = () => {
		setLevelOfStudy(undefined);
		setOnlyUniversityWide(undefined);
	};

	const applyFilters = () => {
		setLevelOfStudy(tempLevelOfStudy);
		setOnlyUniversityWide(tempOnlyUniversityWide);
		setIsDrawerOpen(false);
	};

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
			{isMobile ? (
				<div className="my-4">
					<Button className="w-full" onClick={() => setIsDrawerOpen(true)}>
						{t('search.filters')}
					</Button>
					{(levelOfStudy || onlyUniversityWide) && (
						<div className="mt-2 flex flex-wrap gap-2">
							{levelOfStudy && (
								<Chip
									onClose={() => {
										setLevelOfStudy(undefined);
										setTempLevelOfStudy(undefined);
									}}
									variant="flat"
								>
									{levelOfStudy}
								</Chip>
							)}
							{onlyUniversityWide && (
								<Chip
									onClose={() => {
										setOnlyUniversityWide(undefined);
										setTempOnlyUniversityWide(undefined);
									}}
									variant="flat"
								>
									University Wide Elective
								</Chip>
							)}
						</div>
					)}
					<Drawer
						className="z-100"
						isOpen={isDrawerOpen}
						onOpenChange={handleDrawerChange}
						placement="bottom"
					>
						<DrawerContent>
							<DrawerHeader>{t('search.filters')} </DrawerHeader>
							<DrawerBody>
								<div className="flex flex-col gap-4">
									<div>
										<div className="mb-2 text-sm font-semibold">
											{t('search.level-of-study')}
										</div>
										<div className="flex flex-col gap-2">
											<Checkbox
												isSelected={tempLevelOfStudy === 'Non-award'}
												isDisabled={
													tempLevelOfStudy !== undefined &&
													tempLevelOfStudy !== 'Non-award'
												}
												onValueChange={(isSelected) =>
													setTempLevelOfStudy(
														isSelected ? 'Non-award' : undefined,
													)
												}
											>
												{t('search.level.non-award')}
											</Checkbox>
											<Checkbox
												isSelected={tempLevelOfStudy === 'Undergraduate'}
												isDisabled={
													tempLevelOfStudy !== undefined &&
													tempLevelOfStudy !== 'Undergraduate'
												}
												onValueChange={(isSelected) =>
													setTempLevelOfStudy(
														isSelected ? 'Undergraduate' : undefined,
													)
												}
											>
												{t('search.level.undergraduate')}
											</Checkbox>
											<Checkbox
												isSelected={tempLevelOfStudy === 'Postgraduate'}
												isDisabled={
													tempLevelOfStudy !== undefined &&
													tempLevelOfStudy !== 'Postgraduate'
												}
												onValueChange={(isSelected) =>
													setTempLevelOfStudy(
														isSelected ? 'Postgraduate' : undefined,
													)
												}
											>
												{t('search.level.postgraduate')}
											</Checkbox>
											<Checkbox
												isSelected={tempLevelOfStudy === 'Research'}
												isDisabled={
													tempLevelOfStudy !== undefined &&
													tempLevelOfStudy !== 'Research'
												}
												onValueChange={(isSelected) =>
													setTempLevelOfStudy(
														isSelected ? 'Research' : undefined,
													)
												}
											>
												{t('search.level.research')}
											</Checkbox>
										</div>
									</div>
									<div>
										<div className="mb-2 text-sm font-semibold">
											{t('search.courses-availability')}
										</div>
										<div className="flex flex-col gap-2">
											<Checkbox
												isSelected={tempOnlyUniversityWide === true}
												onValueChange={(isSelected) =>
													setTempOnlyUniversityWide(
														isSelected ? true : undefined,
													)
												}
											>
												{t('search.university-wide-elective')}
											</Checkbox>
										</div>
									</div>
								</div>
							</DrawerBody>
							<DrawerFooter>
								<Button
									className="w-full"
									onClick={() => {
										setTempLevelOfStudy(undefined);
										setTempOnlyUniversityWide(undefined);
									}}
								>
									Reset
								</Button>
								<Button
									className="w-full"
									color="primary"
									onClick={applyFilters}
								>
									Apply
								</Button>
							</DrawerFooter>
						</DrawerContent>
					</Drawer>
				</div>
			) : (
				<div className="my-2">
					<h2 className="text-lg font-semibold">Filters</h2>
					<div className="flex gap-4">
						<div className="my-4">
							<div className="mb-2 text-sm font-semibold">
								{t('search.level-of-study')}
							</div>
							<div className="flex flex-col gap-2">
								<Checkbox
									isSelected={levelOfStudy === 'Non-award'}
									isDisabled={
										levelOfStudy !== undefined && levelOfStudy !== 'Non-award'
									}
									onValueChange={(isSelected) =>
										setLevelOfStudy(isSelected ? 'Non-award' : undefined)
									}
								>
									{t('search.level.non-award')}
								</Checkbox>
								<Checkbox
									isSelected={levelOfStudy === 'Undergraduate'}
									isDisabled={
										levelOfStudy !== undefined &&
										levelOfStudy !== 'Undergraduate'
									}
									onValueChange={(isSelected) =>
										setLevelOfStudy(isSelected ? 'Undergraduate' : undefined)
									}
								>
									{t('search.level.undergraduate')}
								</Checkbox>
								<Checkbox
									isSelected={levelOfStudy === 'Postgraduate'}
									isDisabled={
										levelOfStudy !== undefined &&
										levelOfStudy !== 'Postgraduate'
									}
									onValueChange={(isSelected) =>
										setLevelOfStudy(isSelected ? 'Postgraduate' : undefined)
									}
								>
									{t('search.level.postgraduate')}
								</Checkbox>
								<Checkbox
									isSelected={levelOfStudy === 'Research'}
									isDisabled={
										levelOfStudy !== undefined && levelOfStudy !== 'Research'
									}
									onValueChange={(isSelected) =>
										setLevelOfStudy(isSelected ? 'Research' : undefined)
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
									isSelected={onlyUniversityWide === true}
									onValueChange={(isSelected) =>
										setOnlyUniversityWide(isSelected ? true : undefined)
									}
								>
									{t('search.university-wide-elective')}
								</Checkbox>
							</div>
						</div>
					</div>
					<Button size="sm" onClick={clearFilters}>
						Reset
					</Button>
				</div>
			)}
		</div>
	);
};
