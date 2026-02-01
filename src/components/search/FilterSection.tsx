import { Checkbox } from '@heroui/react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { getCourses } from '../../apis';
import { YEAR } from '../../constants/year';

interface FilterSectionProps {
	selectedTerm: string;
	subject: string | null;
	levelOfStudy: string | undefined;
	onlyUniversityWide: boolean | undefined;
	tempLevelOfStudy: string | undefined;
	tempOnlyUniversityWide: boolean | undefined;
	onLevelOfStudyChange: (value: string | undefined) => void;
	onOnlyUniversityWideChange: (value: boolean | undefined) => void;
	isTemp?: boolean;
}

export const FilterSection = ({
	selectedTerm,
	subject,
	levelOfStudy,
	onlyUniversityWide,
	tempLevelOfStudy,
	tempOnlyUniversityWide,
	onLevelOfStudyChange,
	onOnlyUniversityWideChange,
	isTemp = false,
}: FilterSectionProps) => {
	const { t } = useTranslation();

	const currentLevelOfStudy = isTemp ? tempLevelOfStudy : levelOfStudy;
	const currentOnlyUniversityWide = isTemp
		? tempOnlyUniversityWide
		: onlyUniversityWide;
	const setLevelOfStudy = isTemp
		? (value: string | undefined) => onLevelOfStudyChange(value)
		: onLevelOfStudyChange;
	const setOnlyUniversityWide = isTemp
		? (value: boolean | undefined) => onOnlyUniversityWideChange(value)
		: onOnlyUniversityWideChange;

	const allCoursesQuery = useQuery({
		queryKey: [
			'courses',
			{
				year: YEAR,
				term: selectedTerm,
				subject: subject!,
				university_wide_elective: undefined,
				level_of_study: undefined,
			},
		] as const,
		queryFn: ({ queryKey }) => getCourses(queryKey[1]),
		enabled: subject !== null,
	});

	const allCourses = allCoursesQuery.data?.courses || [];
	const availableLevels = new Set(
		allCourses.map((c) => c.level_of_study).filter(Boolean),
	);
	const hasUniversityWide = allCourses.some((c) => c.university_wide_elective);

	const showAllLevelOptions =
		availableLevels.size === 0 && allCourses.length > 0;
	const showAllUniversityWideOptions =
		!hasUniversityWide && allCourses.length > 0;

	const levelOptions = [
		'Non-award',
		'Undergraduate',
		'Postgraduate',
		'Research',
	];
	const canShowLevel = (level: string) =>
		availableLevels.has(level) ||
		allCoursesQuery.isPending ||
		showAllLevelOptions ||
		subject === null;
	const visibleLevelCount = levelOptions.filter((l) => canShowLevel(l)).length;

	const hideLevelOfStudySection =
		subject !== null && availableLevels.size === 0 && !showAllLevelOptions;
	const hideUniversityWideSection =
		subject !== null && !hasUniversityWide && !showAllUniversityWideOptions;

	return (
		<div className="flex items-start gap-4">
			<div
				className={`flex-none overflow-hidden transition-all duration-300 ease-in-out ${
					hideLevelOfStudySection
						? 'order-1 max-h-0 max-w-0 opacity-0'
						: 'order-0 max-h-249.75 max-w-xl opacity-100'
				}`}
			>
				<div className="mb-2 text-sm font-semibold">
					{t('search.level-of-study')}
				</div>
				<div
					className={`flex flex-col ${visibleLevelCount <= 1 ? '' : 'gap-2'}`}
				>
					<div
						className={`transition-all duration-200 ease-in-out ${
							!(
								availableLevels.has('Non-award') ||
								allCoursesQuery.isPending ||
								showAllLevelOptions ||
								subject === null
							)
								? 'max-h-0 overflow-hidden opacity-0'
								: 'max-h-20 opacity-100'
						}`}
					>
						<Checkbox
							isSelected={currentLevelOfStudy === 'Non-award'}
							isDisabled={
								currentLevelOfStudy !== undefined &&
								currentLevelOfStudy !== 'Non-award'
							}
							onValueChange={(isSelected) =>
								setLevelOfStudy(isSelected ? 'Non-award' : undefined)
							}
						>
							{t('search.level.non-award')}
						</Checkbox>
					</div>
					<div
						className={`transition-all duration-200 ease-in-out ${
							!(
								availableLevels.has('Undergraduate') ||
								allCoursesQuery.isPending ||
								showAllLevelOptions ||
								subject === null
							)
								? 'max-h-0 overflow-hidden opacity-0'
								: 'max-h-20 opacity-100'
						}`}
					>
						<Checkbox
							isSelected={currentLevelOfStudy === 'Undergraduate'}
							isDisabled={
								currentLevelOfStudy !== undefined &&
								currentLevelOfStudy !== 'Undergraduate'
							}
							onValueChange={(isSelected) =>
								setLevelOfStudy(isSelected ? 'Undergraduate' : undefined)
							}
						>
							{t('search.level.undergraduate')}
						</Checkbox>
					</div>
					<div
						className={`transition-all duration-200 ease-in-out ${
							!(
								availableLevels.has('Postgraduate') ||
								allCoursesQuery.isPending ||
								showAllLevelOptions ||
								subject === null
							)
								? 'max-h-0 overflow-hidden opacity-0'
								: 'max-h-20 opacity-100'
						}`}
					>
						<Checkbox
							isSelected={currentLevelOfStudy === 'Postgraduate'}
							isDisabled={
								currentLevelOfStudy !== undefined &&
								currentLevelOfStudy !== 'Postgraduate'
							}
							onValueChange={(isSelected) =>
								setLevelOfStudy(isSelected ? 'Postgraduate' : undefined)
							}
						>
							{t('search.level.postgraduate')}
						</Checkbox>
					</div>
					<div
						className={`transition-all duration-200 ease-in-out ${
							!(
								availableLevels.has('Research') ||
								allCoursesQuery.isPending ||
								showAllLevelOptions ||
								subject === null
							)
								? 'max-h-0 overflow-hidden opacity-0'
								: 'max-h-20 opacity-100'
						}`}
					>
						<Checkbox
							isSelected={currentLevelOfStudy === 'Research'}
							isDisabled={
								currentLevelOfStudy !== undefined &&
								currentLevelOfStudy !== 'Research'
							}
							onValueChange={(isSelected) =>
								setLevelOfStudy(isSelected ? 'Research' : undefined)
							}
						>
							{t('search.level.research')}
						</Checkbox>
					</div>
				</div>
			</div>
			<div
				className={`flex-none overflow-hidden transition-all duration-300 ease-in-out ${
					hideUniversityWideSection
						? 'order-1 max-h-0 max-w-0 opacity-0'
						: 'max-h-249.75px order-0 max-w-xl opacity-100'
				}`}
			>
				<div className="mb-2 text-sm font-semibold">
					{t('search.courses-availability')}
				</div>
				<div className="flex flex-col gap-2">
					<div
						className={`transition-all duration-200 ease-in-out ${
							!(
								hasUniversityWide ||
								allCoursesQuery.isPending ||
								showAllUniversityWideOptions ||
								subject === null
							)
								? 'max-h-0 overflow-hidden opacity-0'
								: 'max-h-20 opacity-100'
						}`}
					>
						<Checkbox
							isSelected={currentOnlyUniversityWide === true}
							onValueChange={(isSelected) =>
								setOnlyUniversityWide(isSelected ? true : undefined)
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
