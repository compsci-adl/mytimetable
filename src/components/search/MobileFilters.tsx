import { Button, Chip, CloseButton, Drawer, Tooltip } from '@heroui/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaFilter } from 'react-icons/fa';

import { useEnrolledCourses } from '../../data/enrolled-courses';
import { AutoTimetable } from '../AutoTimetable';
import { FilterSection } from './FilterSection';

interface MobileFiltersProps {
	selectedTerm: string;
	subject: string | null;
	levelOfStudy: string | undefined;
	onlyUniversityWide: boolean | undefined;
	campuses: string[] | undefined;
	tempLevelOfStudy: string | undefined;
	tempOnlyUniversityWide: boolean | undefined;
	tempCampuses: string[] | undefined;
	isDrawerOpen: boolean;
	onDrawerChange: (open: boolean) => void;
	onTempLevelOfStudyChange: (value: string | undefined) => void;
	onTempOnlyUniversityWideChange: (value: boolean | undefined) => void;
	onTempCampusesChange: (value: string[] | undefined) => void;
	onLevelOfStudyChange: (value: string | undefined) => void;
	onOnlyUniversityWideChange: (value: boolean | undefined) => void;
	onCampusChange: (value: string[] | undefined) => void;
	onApplyFilters: () => void;
}

export const MobileFilters = ({
	selectedTerm,
	subject,
	levelOfStudy,
	onlyUniversityWide,
	campuses,
	tempLevelOfStudy,
	tempOnlyUniversityWide,
	tempCampuses,
	isDrawerOpen,
	onDrawerChange,
	onTempLevelOfStudyChange,
	onTempOnlyUniversityWideChange,
	onTempCampusesChange,
	onLevelOfStudyChange,
	onOnlyUniversityWideChange,
	onCampusChange,
	onApplyFilters,
}: MobileFiltersProps) => {
	const { t } = useTranslation();
	const courses = useEnrolledCourses((s) => s.courses);

	const [isClosingLevel, setIsClosingLevel] = useState(false);
	const [isClosingUni, setIsClosingUni] = useState(false);
	const EXIT_MS = 200;

	const levelTimeoutRef = useRef<number | null>(null);
	const uniTimeoutRef = useRef<number | null>(null);

	useEffect(() => {
		return () => {
			if (levelTimeoutRef.current) clearTimeout(levelTimeoutRef.current);
			if (uniTimeoutRef.current) clearTimeout(uniTimeoutRef.current);
		};
	}, []);

	const handleDrawerChange = (open: boolean) => {
		onDrawerChange(open);
		if (open) {
			onTempLevelOfStudyChange(levelOfStudy);
			onTempOnlyUniversityWideChange(onlyUniversityWide);
			onTempCampusesChange(campuses);
		} else {
			onTempLevelOfStudyChange(levelOfStudy);
			onTempOnlyUniversityWideChange(onlyUniversityWide);
			onTempCampusesChange(campuses);
		}
	};

	return (
		<div className="my-4">
			<div className="flex w-full gap-2">
				<Button
					size="sm"
					className="h-8 flex-1 rounded-full"
					onPress={() => onDrawerChange(true)}
					variant="secondary"
				>
					<FaFilter className="mr-1" />
					{t('search.filters')}
				</Button>
				<div className="flex-1">
					{courses.length === 0 ? (
						<Tooltip delay={0}>
							<Tooltip.Trigger className="w-full">
								<span className="block w-full">
									<AutoTimetable className="!w-full" isDisabled={true} />
								</span>
							</Tooltip.Trigger>
							<Tooltip.Content>Please select a course first</Tooltip.Content>
						</Tooltip>
					) : (
						<AutoTimetable className="!w-full" isDisabled={false} />
					)}
				</div>
			</div>
			{(levelOfStudy ||
				onlyUniversityWide ||
				(campuses && campuses.length > 0)) && (
				<div className="mt-3 flex flex-wrap gap-2">
					<div
						className={`transform overflow-hidden transition-all duration-200 ease-in-out ${
							levelOfStudy && !isClosingLevel
								? 'max-h-20 scale-100 opacity-100'
								: 'max-h-0 scale-95 opacity-0'
						}`}
					>
						{levelOfStudy && (
							<Chip
								variant="secondary"
								className="border-separator bg-content2/50 text-foreground flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium"
							>
								<span>{levelOfStudy}</span>
								<CloseButton
									aria-label="Remove filter"
									onPress={() => {
										setIsClosingLevel(true);
										if (levelTimeoutRef.current)
											clearTimeout(levelTimeoutRef.current);
										levelTimeoutRef.current = window.setTimeout(() => {
											onLevelOfStudyChange(undefined);
											setIsClosingLevel(false);
											levelTimeoutRef.current = null;
										}, EXIT_MS);
									}}
									className="h-4 w-4 rounded-full"
								/>
							</Chip>
						)}
					</div>
					<div
						className={`transform overflow-hidden transition-all duration-200 ease-in-out ${
							onlyUniversityWide && !isClosingUni
								? 'max-h-20 scale-100 opacity-100'
								: 'max-h-0 scale-95 opacity-0'
						}`}
					>
						{onlyUniversityWide && (
							<Chip
								variant="secondary"
								className="border-separator bg-content2/50 text-foreground flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium"
							>
								<span>University-wide elective</span>
								<CloseButton
									aria-label="Remove filter"
									onPress={() => {
										setIsClosingUni(true);
										if (uniTimeoutRef.current)
											clearTimeout(uniTimeoutRef.current);
										uniTimeoutRef.current = window.setTimeout(() => {
											onOnlyUniversityWideChange(undefined);
											setIsClosingUni(false);
											uniTimeoutRef.current = null;
										}, EXIT_MS);
									}}
									className="h-4 w-4 rounded-full"
								/>
							</Chip>
						)}
					</div>
					{campuses && campuses.length > 0 && (
						<>
							{campuses.map((c) => (
								<Chip
									key={c}
									variant="secondary"
									className="border-separator bg-content2/50 text-foreground flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium"
								>
									<span>{c}</span>
									<CloseButton
										aria-label="Remove filter"
										onPress={() => {
											const next = campuses.filter((x) => x !== c);
											onCampusChange(next.length > 0 ? next : undefined);
										}}
										className="h-4 w-4 rounded-full"
									/>
								</Chip>
							))}
						</>
					)}
				</div>
			)}
			<Drawer>
				<Drawer.Backdrop
					isOpen={isDrawerOpen}
					onOpenChange={handleDrawerChange}
					variant="opaque"
					className="z-100"
				>
					<Drawer.Content placement="bottom">
						<Drawer.Dialog className="bg-background border-separator max-h-[85vh] overflow-y-auto rounded-t-3xl border-t p-6 pb-12 shadow-2xl">
							<Drawer.Header className="border-separator/50 border-b pb-2">
								<Drawer.Heading className="text-foreground flex items-center gap-2 text-xl font-bold">
									<FaFilter className="text-primary text-sm" />
									<span>{t('search.filters')}</span>
								</Drawer.Heading>
							</Drawer.Header>
							<Drawer.Body className="pt-4">
								<FilterSection
									selectedTerm={selectedTerm}
									subject={subject}
									levelOfStudy={levelOfStudy}
									onlyUniversityWide={onlyUniversityWide}
									campuses={campuses}
									tempLevelOfStudy={tempLevelOfStudy}
									tempOnlyUniversityWide={tempOnlyUniversityWide}
									tempCampuses={tempCampuses}
									onLevelOfStudyChange={onTempLevelOfStudyChange}
									onOnlyUniversityWideChange={onTempOnlyUniversityWideChange}
									onCampusChange={onTempCampusesChange}
									isTemp={true}
								/>
								<div className="border-separator mt-6 flex gap-3 border-t pt-4">
									<Button
										className="w-full rounded-full"
										variant="secondary"
										onPress={() => {
											onTempLevelOfStudyChange(undefined);
											onTempOnlyUniversityWideChange(undefined);
											onTempCampusesChange(undefined);
										}}
									>
										Reset
									</Button>
									<Button
										className="w-full rounded-full"
										variant="primary"
										onPress={() => {
											onApplyFilters();
											onDrawerChange(false);
										}}
									>
										Apply
									</Button>
								</div>
							</Drawer.Body>
						</Drawer.Dialog>
					</Drawer.Content>
				</Drawer.Backdrop>
			</Drawer>
		</div>
	);
};
