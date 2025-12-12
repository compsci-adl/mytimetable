import { useEffect, useState } from 'react';

import { getCourses } from '../apis';
import { LocalStorageKey } from '../constants/local-storage-keys';
import { YEAR } from '../constants/year';
import { CourseSelector } from './search/CourseSelector';
import { DesktopFilters } from './search/DesktopFilters';
import { MobileFilters } from './search/MobileFilters';
import { SubjectSelector } from './search/SubjectSelector';
import { TermSelector } from './search/TermSelector';
import { useSelectedTerm } from '../helpers/term';

export const SearchForm = () => {
	const selectedTerm = useSelectedTerm();

	const [subject, setSubject] = useState<string | null>(null);
	const [onlyUniversityWide, setOnlyUniversityWide] = useState<
		boolean | undefined
	>(undefined);
	const [levelOfStudy, setLevelOfStudy] = useState<string | undefined>(
		undefined,
	);
	const [campuses, setCampuses] = useState<string[] | undefined>(undefined);
	const [isMobile, setIsMobile] = useState(false);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [tempLevelOfStudy, setTempLevelOfStudy] = useState<string | undefined>(
		undefined,
	);
	const [tempOnlyUniversityWide, setTempOnlyUniversityWide] = useState<
		boolean | undefined
	>(undefined);
	const [tempCampuses, setTempCampuses] = useState<string[] | undefined>(
		undefined,
	);

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

	const applyFilters = () => {
		setLevelOfStudy(tempLevelOfStudy);
		setOnlyUniversityWide(tempOnlyUniversityWide);
		setCampuses(tempCampuses);
		setIsDrawerOpen(false);
	};

	useEffect(() => {
		if (!subject) return;
		let mounted = true;
		getCourses({ year: YEAR, term: selectedTerm.term, subject }).then((res) => {
			if (!mounted) return;
			const allCourses = res?.courses ?? [];
			const availableLevels = new Set(
				allCourses.map((c) => c.level_of_study).filter(Boolean),
			);
			const hasUniversityWide = allCourses.some(
				(c) => c.university_wide_elective,
			);

			const showAllLevelOptions =
				allCourses.length > 0 && availableLevels.size === 0;
			const showAllUniversityWideOptions =
				allCourses.length > 0 && !hasUniversityWide;

			if (
				levelOfStudy !== undefined &&
				!(availableLevels.has(levelOfStudy) || showAllLevelOptions)
			) {
				setLevelOfStudy(undefined);
				setTempLevelOfStudy(undefined);
			}

			if (
				onlyUniversityWide !== undefined &&
				!(hasUniversityWide || showAllUniversityWideOptions)
			) {
				setOnlyUniversityWide(undefined);
				setTempOnlyUniversityWide(undefined);
			}

			const availableCampuses = new Set<string>();
			allCourses.forEach((c) => {
				const courseWithCampus = c as { campus?: string };
				const campusField = courseWithCampus.campus;
				if (!campusField) return;
				campusField.split(',').forEach((p: string) => {
					availableCampuses.add(p.trim());
				});
			});

			if (campuses && campuses.length > 0) {
				const filtered = campuses.filter((c) => availableCampuses.has(c));
				if (filtered.length !== campuses.length) {
					setCampuses(filtered.length > 0 ? filtered : undefined);
					setTempCampuses(filtered.length > 0 ? filtered : undefined);
				}
			}
		});

		return () => {
			mounted = false;
		};
	}, [subject, selectedTerm, levelOfStudy, onlyUniversityWide]);

	return (
		<div>
			<div className="mobile:flex-col flex gap-2">
				<TermSelector
					selectedTerm={selectedTerm.term}
					onTermChange={selectedTerm.set}
				/>
				<SubjectSelector
					selectedTerm={selectedTerm.term}
					subject={subject}
					onSubjectChange={setSubject}
				/>
				<CourseSelector
					selectedTerm={selectedTerm.term}
					subject={subject}
					onlyUniversityWide={onlyUniversityWide}
					levelOfStudy={levelOfStudy}
					campuses={campuses}
				/>
			</div>
			{isMobile ? (
				<MobileFilters
					selectedTerm={selectedTerm.term}
					subject={subject}
					levelOfStudy={levelOfStudy}
					onlyUniversityWide={onlyUniversityWide}
					tempLevelOfStudy={tempLevelOfStudy}
					tempOnlyUniversityWide={tempOnlyUniversityWide}
					campuses={campuses}
					tempCampuses={tempCampuses}
					isDrawerOpen={isDrawerOpen}
					onDrawerChange={handleDrawerChange}
					onTempLevelOfStudyChange={setTempLevelOfStudy}
					onTempOnlyUniversityWideChange={setTempOnlyUniversityWide}
					onLevelOfStudyChange={setLevelOfStudy}
					onOnlyUniversityWideChange={setOnlyUniversityWide}
					onTempCampusesChange={setTempCampuses}
					onCampusChange={setCampuses}
					onApplyFilters={applyFilters}
				/>
			) : (
				<DesktopFilters
					selectedTerm={selectedTerm.term}
					subject={subject}
					levelOfStudy={levelOfStudy}
					onlyUniversityWide={onlyUniversityWide}
					campuses={campuses}
					tempLevelOfStudy={tempLevelOfStudy}
					tempOnlyUniversityWide={tempOnlyUniversityWide}
					tempCampuses={tempCampuses}
					onLevelOfStudyChange={setLevelOfStudy}
					onOnlyUniversityWideChange={setOnlyUniversityWide}
					onCampusChange={setCampuses}
					onTempLevelOfStudyChange={setTempLevelOfStudy}
					onTempOnlyUniversityWideChange={setTempOnlyUniversityWide}
					onTempCampusesChange={setTempCampuses}
					onApplyFilters={applyFilters}
				/>
			)}
		</div>
	);
};
