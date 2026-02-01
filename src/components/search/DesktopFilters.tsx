import { Button, Chip } from '@heroui/react';
import {
	Modal,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	useDisclosure,
} from '@heroui/react';
import { FaFilter } from 'react-icons/fa';

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
	const { isOpen, onOpen, onOpenChange } = useDisclosure();

	const handleOpen = () => {
		onTempLevelOfStudyChange(levelOfStudy);
		onTempOnlyUniversityWideChange(onlyUniversityWide);
		onTempCampusesChange(campuses);
		onOpen();
	};

	const handleReset = () => {
		onTempLevelOfStudyChange(undefined);
		onTempOnlyUniversityWideChange(undefined);
		onTempCampusesChange(undefined);
	};

	return (
		<div className="my-4">
			<div className="flex items-start gap-4">
				<Button size="sm" className="shrink-0 self-start" onPress={handleOpen}>
					<FaFilter className="mr-1" />
					Filters
				</Button>

				{/* Filter Chips */}
				<div className="flex flex-wrap gap-2">
					{levelOfStudy && (
						<Chip
							onClose={() => onLevelOfStudyChange(undefined)}
							variant="flat"
						>
							{levelOfStudy}
						</Chip>
					)}
					{onlyUniversityWide && (
						<Chip
							onClose={() => onOnlyUniversityWideChange(undefined)}
							variant="flat"
						>
							University Wide Elective
						</Chip>
					)}
					{campuses &&
						campuses.length > 0 &&
						campuses.map((c) => (
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
				</div>
			</div>

			<Modal isOpen={isOpen} onOpenChange={onOpenChange} size="4xl">
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader className="flex flex-col gap-1">Filters</ModalHeader>
							<ModalBody>
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
							</ModalBody>
							<ModalFooter className="flex justify-between">
								<Button onPress={handleReset}>Reset</Button>
								<Button
									color="primary"
									onPress={() => {
										onApplyFilters();
										onClose();
									}}
								>
									Apply
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>
		</div>
	);
};
