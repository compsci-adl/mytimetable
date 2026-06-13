import { Button, Drawer, Modal } from '@heroui/react';
import { useEffect, useState } from 'react';

import { getCourses } from '../apis';
import { YEAR } from '../constants/year';
import { useEnrolledCourses } from '../data/enrolled-courses';
import { useFilters } from '../data/filters';
import { CourseSelector } from './search/CourseSelector';
import { DesktopFilters } from './search/DesktopFilters';
import { MobileFilters } from './search/MobileFilters';
import { SubjectSelector } from './search/SubjectSelector';
import { TermSelector } from './search/TermSelector';

export const SearchForm = () => {
	const enrolledCourses = useEnrolledCourses();
	const clearCourses = useEnrolledCourses((s) => s.clearCourses);

	const selectedTerm = useFilters((s) => s.term);
	const setSelectedTerm = useFilters((s) => s.setTerm);
	const campuses = useFilters((s) => s.campuses);
	const setCampuses = useFilters((s) => s.setCampuses);

	const hasCourses = enrolledCourses.courses.length > 0;

	// Pending term the user wants to switch to (held while confirm modal is open)
	const [pendingTerm, setPendingTerm] = useState<string | null>(null);
	const isConfirmOpen = pendingTerm !== null;

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
	const [tempCampuses, setTempCampuses] = useState<string[] | undefined>(
		campuses,
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
			setTempCampuses(campuses);
		} else {
			setTempLevelOfStudy(levelOfStudy);
			setTempOnlyUniversityWide(onlyUniversityWide);
			setTempCampuses(campuses);
		}
	};

	const applyFilters = () => {
		setLevelOfStudy(tempLevelOfStudy);
		setOnlyUniversityWide(tempOnlyUniversityWide);
		setCampuses(tempCampuses);
		setIsDrawerOpen(false);
	};

	// Called whenever the user picks a term from the dropdown
	const handleTermChange = (term: string) => {
		if (hasCourses) {
			// Show confirmation modal instead of immediately switching
			setPendingTerm(term);
		} else {
			setSelectedTerm(term);
		}
	};

	const handleConfirmSwitch = () => {
		if (pendingTerm) {
			clearCourses();
			setSelectedTerm(pendingTerm);
		}
		setPendingTerm(null);
	};

	const handleCancelSwitch = () => {
		setPendingTerm(null);
	};

	useEffect(() => {
		if (!subject) return;
		let mounted = true;
		getCourses({ year: YEAR, term: selectedTerm, subject }).then((res) => {
			if (!mounted) return;
			const allCourses = res?.courses ?? [];
			const availableLevels = new Set(
				allCourses.map((c) => c.level_of_study?.toLowerCase()).filter(Boolean),
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
				!(
					availableLevels.has(levelOfStudy.toLowerCase()) || showAllLevelOptions
				)
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
	}, [
		subject,
		selectedTerm,
		levelOfStudy,
		onlyUniversityWide,
		campuses,
		setCampuses,
	]);

	return (
		<div>
			{/* Term-change confirmation — bottom drawer on mobile, modal on desktop */}
			{isMobile ? (
				<Drawer>
					<Drawer.Backdrop
						variant="opaque"
						isOpen={isConfirmOpen}
						onOpenChange={(open) => !open && handleCancelSwitch()}
					>
						<Drawer.Content placement="bottom">
							<Drawer.Dialog className="bg-background border-separator rounded-t-3xl border-t p-6 pb-10 shadow-2xl">
								<Drawer.Handle />
								<Drawer.Header className="border-separator/50 flex w-full flex-col gap-1 border-b pb-3">
									<Drawer.Heading className="text-lg font-bold">
										Change term?
									</Drawer.Heading>
								</Drawer.Header>
								<Drawer.Body className="mt-4">
									<p className="text-foreground/75 text-sm leading-relaxed">
										You have added courses for the current term. Switching terms
										will{' '}
										<span className="text-danger font-semibold">
											clear all added courses
										</span>
										. Are you sure you want to switch terms?
									</p>
								</Drawer.Body>
								<div className="mt-5 flex flex-col gap-2">
									<Button
										variant="danger"
										onPress={handleConfirmSwitch}
										className="w-full rounded-xl"
									>
										Switch anyway
									</Button>
									<Button
										variant="secondary"
										onPress={handleCancelSwitch}
										className="w-full rounded-xl"
									>
										Cancel
									</Button>
								</div>
							</Drawer.Dialog>
						</Drawer.Content>
					</Drawer.Backdrop>
				</Drawer>
			) : (
				<Modal.Backdrop
					variant="opaque"
					isOpen={isConfirmOpen}
					onOpenChange={(open) => !open && handleCancelSwitch()}
				>
					<Modal.Container size="sm">
						<Modal.Dialog className="bg-background border-separator rounded-3xl border p-6 shadow-2xl">
							<header className="contents">
								<Modal.Header className="border-separator/50 flex w-full flex-col gap-1 border-b pb-3">
									<Modal.Heading className="text-lg font-bold">
										Change term?
									</Modal.Heading>
								</Modal.Header>
							</header>
							<Modal.Body className="mt-4">
								<p className="text-foreground/75 text-sm leading-relaxed">
									You have added courses for the current term. Switching terms
									will{' '}
									<span className="text-danger font-semibold">
										clear all added courses
									</span>
									. Are you sure you want to switch terms?
								</p>
							</Modal.Body>
							<Modal.Footer className="mt-5 flex justify-end gap-2">
								<Button
									variant="secondary"
									onPress={handleCancelSwitch}
									className="rounded-xl"
								>
									Cancel
								</Button>
								<Button
									variant="danger"
									onPress={handleConfirmSwitch}
									className="rounded-xl"
								>
									Switch anyway
								</Button>
							</Modal.Footer>
						</Modal.Dialog>
					</Modal.Container>
				</Modal.Backdrop>
			)}

			<div className="mobile:flex-row mobile:items-end flex flex-col items-stretch gap-2">
				<TermSelector
					selectedTerm={selectedTerm}
					onTermChange={handleTermChange}
					isDisabled={false}
				/>
				<SubjectSelector
					selectedTerm={selectedTerm}
					subject={subject}
					onSubjectChange={setSubject}
				/>
				<CourseSelector
					selectedTerm={selectedTerm}
					subject={subject}
					onlyUniversityWide={onlyUniversityWide}
					levelOfStudy={levelOfStudy}
					campuses={campuses}
				/>
			</div>
			{isMobile ? (
				<MobileFilters
					selectedTerm={selectedTerm}
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
					selectedTerm={selectedTerm}
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
