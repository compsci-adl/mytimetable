import { Button } from '@heroui/react';

import { FilterSection } from './FilterSection';

interface DesktopFiltersProps {
	selectedTerm: string;
	subject: string | null;
	levelOfStudy: string | undefined;
	onlyUniversityWide: boolean | undefined;
	campuses: string[] | undefined;
	onLevelOfStudyChange: (value: string | undefined) => void;
	onOnlyUniversityWideChange: (value: boolean | undefined) => void;
	onClearFilters: () => void;
}

export const DesktopFilters = ({
	selectedTerm,
	subject,
	levelOfStudy,
	onlyUniversityWide,
	campuses,
	onLevelOfStudyChange,
	onOnlyUniversityWideChange,
	onClearFilters,
}: DesktopFiltersProps) => {
	return (
		<div className="my-2">
			<h2 className="text-lg font-semibold">Filters</h2>
			<div className="flex items-start justify-between">
				<div className="flex gap-4">
					<FilterSection
						selectedTerm={selectedTerm}
						subject={subject}
						levelOfStudy={levelOfStudy}
						onlyUniversityWide={onlyUniversityWide}
						campuses={campuses}
						tempLevelOfStudy={levelOfStudy}
						tempOnlyUniversityWide={onlyUniversityWide}
						tempCampuses={campuses}
						onLevelOfStudyChange={onLevelOfStudyChange}
						onOnlyUniversityWideChange={onOnlyUniversityWideChange}
						onCampusChange={() => {}}
					/>
				</div>
				<Button size="sm" onClick={onClearFilters}>
					Reset
				</Button>
			</div>
		</div>
	);
};
