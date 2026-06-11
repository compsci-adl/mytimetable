import { Button, Chip, CloseButton, Modal, Tooltip } from '@heroui/react';
import { useState } from 'react';
import { FaFilter } from 'react-icons/fa';

import { useEnrolledCourses } from '../../data/enrolled-courses';
import { AutoTimetable } from '../AutoTimetable';
import { FilterSection } from './FilterSection';

interface DesktopFiltersProps {
	selectedTerm: string;
	subject: string | null;
	levelOfStudy: string | undefined;
	onlyUniversityWide: boolean | undefined;
	campuses: string[] | undefined;
	tempLevelOfStudy: string | undefined;
	tempOnlyUniversityWide: boolean | undefined;
	tempCampuses: string[] | undefined;
	onLevelOfStudyChange: (value: string | undefined) => void;
	onOnlyUniversityWideChange: (value: boolean | undefined) => void;
	onCampusChange: (value: string[] | undefined) => void;
	onTempLevelOfStudyChange: (value: string | undefined) => void;
	onTempOnlyUniversityWideChange: (value: boolean | undefined) => void;
	onTempCampusesChange: (value: string[] | undefined) => void;
	onApplyFilters: () => void;
}

export const DesktopFilters = ({
	selectedTerm,
	subject,
	levelOfStudy,
	onlyUniversityWide,
	campuses,
	tempLevelOfStudy,
	tempOnlyUniversityWide,
	tempCampuses,
	onLevelOfStudyChange,
	onOnlyUniversityWideChange,
	onCampusChange,
	onTempLevelOfStudyChange,
	onTempOnlyUniversityWideChange,
	onTempCampusesChange,
	onApplyFilters,
}: DesktopFiltersProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const courses = useEnrolledCourses((s) => s.courses);

	const handleOpen = () => {
		onTempLevelOfStudyChange(levelOfStudy);
		onTempOnlyUniversityWideChange(onlyUniversityWide);
		onTempCampusesChange(campuses);
		setIsOpen(true);
	};

	const handleReset = () => {
		onTempLevelOfStudyChange(undefined);
		onTempOnlyUniversityWideChange(undefined);
		onTempCampusesChange(undefined);
	};

	return (
		<>
			<div className="my-4 flex flex-wrap items-center justify-between gap-2">
				<div className="flex flex-wrap items-center gap-2">
					<Button
						className="rounded-full"
						onPress={handleOpen}
						variant="secondary"
					>
						<FaFilter className="mr-1.5" />
						Filters
					</Button>
					{levelOfStudy && (
						<Chip
							variant="secondary"
							className="border-separator bg-content2/50 text-foreground flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium"
						>
							<span>{levelOfStudy}</span>
							<CloseButton
								aria-label="Remove filter"
								onPress={() => onLevelOfStudyChange(undefined)}
								className="h-4 w-4 rounded-full"
							/>
						</Chip>
					)}
					{onlyUniversityWide && (
						<Chip
							variant="secondary"
							className="border-separator bg-content2/50 text-foreground flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium"
						>
							<span>University-wide elective</span>
							<CloseButton
								aria-label="Remove filter"
								onPress={() => onOnlyUniversityWideChange(undefined)}
								className="h-4 w-4 rounded-full"
							/>
						</Chip>
					)}
					{campuses &&
						campuses.length > 0 &&
						campuses.map((c) => (
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
				</div>
				{courses.length === 0 ? (
					<Tooltip delay={0}>
						<Tooltip.Trigger>
							<span className="inline-block">
								<AutoTimetable isDisabled={true} />
							</span>
						</Tooltip.Trigger>
						<Tooltip.Content>Please select a course first</Tooltip.Content>
					</Tooltip>
				) : (
					<AutoTimetable isDisabled={false} />
				)}
			</div>

			<Modal>
				<Modal.Backdrop
					isOpen={isOpen}
					onOpenChange={setIsOpen}
					variant="opaque"
				>
					<Modal.Container size="lg">
						<Modal.Dialog className="bg-background border-separator w-full max-w-4xl rounded-3xl border p-6 shadow-2xl">
							<Modal.CloseTrigger className="hover:bg-default-100 rounded-full" />
							<Modal.Header className="border-separator/50 border-b pb-2">
								<Modal.Heading className="text-foreground flex items-center gap-2 text-xl font-bold">
									<FaFilter className="text-primary text-sm" />
									<span>Filters</span>
								</Modal.Heading>
							</Modal.Header>
							<Modal.Body>
								<FilterSection
									selectedTerm={selectedTerm}
									subject={subject}
									levelOfStudy={tempLevelOfStudy}
									onlyUniversityWide={tempOnlyUniversityWide}
									campuses={tempCampuses}
									tempLevelOfStudy={tempLevelOfStudy}
									tempOnlyUniversityWide={tempOnlyUniversityWide}
									tempCampuses={tempCampuses}
									onLevelOfStudyChange={onTempLevelOfStudyChange}
									onOnlyUniversityWideChange={onTempOnlyUniversityWideChange}
									onCampusChange={onTempCampusesChange}
									isTemp={true}
								/>
							</Modal.Body>
							<Modal.Footer className="border-separator mt-4 flex justify-between border-t pt-4">
								<Button
									onPress={handleReset}
									variant="secondary"
									className="rounded-full"
								>
									Reset
								</Button>
								<Button
									variant="primary"
									className="rounded-full"
									onPress={() => {
										onApplyFilters();
										setIsOpen(false);
									}}
								>
									Apply
								</Button>
							</Modal.Footer>
						</Modal.Dialog>
					</Modal.Container>
				</Modal.Backdrop>
			</Modal>
		</>
	);
};
