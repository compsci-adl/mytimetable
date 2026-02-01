import {
	Button,
	Chip,
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerBody,
	DrawerFooter,
} from '@heroui/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaFilter } from 'react-icons/fa';

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
			<Button className="w-full" onClick={() => onDrawerChange(true)}>
				<FaFilter className="mr-1" />
				{t('search.filters')}
			</Button>
			<div className="mt-2 flex flex-wrap gap-2">
				<div
					className={`transform overflow-hidden transition-all duration-200 ease-in-out ${
						levelOfStudy && !isClosingLevel
							? 'max-h-20 scale-100 opacity-100'
							: 'max-h-0 scale-95 opacity-0'
					}`}
				>
					{levelOfStudy && (
						<Chip
							onClose={() => {
								setIsClosingLevel(true);
								if (levelTimeoutRef.current)
									clearTimeout(levelTimeoutRef.current);
								levelTimeoutRef.current = window.setTimeout(() => {
									onLevelOfStudyChange(undefined);
									setIsClosingLevel(false);
									levelTimeoutRef.current = null;
								}, EXIT_MS);
							}}
							variant="flat"
						>
							{levelOfStudy}
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
							onClose={() => {
								setIsClosingUni(true);
								if (uniTimeoutRef.current) clearTimeout(uniTimeoutRef.current);
								uniTimeoutRef.current = window.setTimeout(() => {
									onOnlyUniversityWideChange(undefined);
									setIsClosingUni(false);
									uniTimeoutRef.current = null;
								}, EXIT_MS);
							}}
							variant="flat"
						>
							University Wide Elective
						</Chip>
					)}
				</div>
				{campuses && campuses.length > 0 && (
					<>
						{campuses.map((c) => (
							<Chip
								key={c}
								onClose={() => {
									const next = campuses.filter((x) => x !== c);
									onCampusChange(next.length > 0 ? next : undefined);
								}}
								variant="flat"
							>
								{c}
							</Chip>
						))}
					</>
				)}
			</div>
			<Drawer
				className="z-100"
				isOpen={isDrawerOpen}
				onOpenChange={handleDrawerChange}
				placement="bottom"
			>
				<DrawerContent>
					<DrawerHeader>{t('search.filters')} </DrawerHeader>
					<DrawerBody>
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
					</DrawerBody>
					<DrawerFooter>
						<Button
							className="w-full"
							onClick={() => {
								onTempLevelOfStudyChange(undefined);
								onTempOnlyUniversityWideChange(undefined);
								onTempCampusesChange(undefined);
							}}
						>
							Reset
						</Button>
						<Button className="w-full" color="primary" onClick={onApplyFilters}>
							Apply
						</Button>
					</DrawerFooter>
				</DrawerContent>
			</Drawer>
		</div>
	);
};
