import { Button } from '@heroui/react';

import { FilterSection } from './FilterSection';

interface DesktopFiltersProps {
	selectedTerm: string;
	subject: string | null;
	levelOfStudy: string | undefined;
	onlyUniversityWide: boolean | undefined;
	onLevelOfStudyChange: (value: string | undefined) => void;
	onOnlyUniversityWideChange: (value: boolean | undefined) => void;
	onClearFilters: () => void;
}

export const DesktopFilters = ({
	selectedTerm,
	subject,
	levelOfStudy,
	onlyUniversityWide,
	onLevelOfStudyChange,
	onOnlyUniversityWideChange,
	onClearFilters,
}: DesktopFiltersProps) => {
	return (
		<div className="my-2">
			<h2 className="text-lg font-semibold">Filters</h2>
			<div className="flex gap-4">
				<FilterSection
					selectedTerm={selectedTerm}
					subject={subject}
					levelOfStudy={levelOfStudy}
					onlyUniversityWide={onlyUniversityWide}
					tempLevelOfStudy={levelOfStudy}
					tempOnlyUniversityWide={onlyUniversityWide}
					onLevelOfStudyChange={onLevelOfStudyChange}
					onOnlyUniversityWideChange={onOnlyUniversityWideChange}
				/>
			</div>
			<div className="mt-2">
				<Button size="sm" onClick={onClearFilters}>
					Reset
				</Button>
			</div>
		</div>
	);
};
