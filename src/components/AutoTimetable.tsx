import {
	Button,
	Drawer,
	DrawerBody,
	DrawerContent,
	DrawerHeader,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Select,
	SelectItem,
	Slider,
	Switch,
	Tooltip,
} from '@heroui/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaBolt, FaChevronDown, FaInfoCircle } from 'react-icons/fa';
import { toast } from 'sonner';

import { useCoursesInfo } from '../data/course-info';
import { useEnrolledCourses } from '../data/enrolled-courses';
import {
	coursesToVariables,
	solveAutoTimetable,
	checkViolations,
} from '../helpers/auto-timetable';

const START_TIMES = [
	{ value: '07:00', label: '7am' },
	{ value: '08:00', label: '8am' },
	{ value: '09:00', label: '9am' },
	{ value: '10:00', label: '10am' },
	{ value: '11:00', label: '11am' },
	{ value: '12:00', label: '12pm' },
];

const END_TIMES = [
	{ value: '15:00', label: '3pm' },
	{ value: '16:00', label: '4pm' },
	{ value: '17:00', label: '5pm' },
	{ value: '18:00', label: '6pm' },
	{ value: '19:00', label: '7pm' },
	{ value: '20:00', label: '8pm' },
	{ value: '21:00', label: '9pm' },
];

const LUNCH_START_TIMES = [
	{ value: '11:00', label: '11am' },
	{ value: '12:00', label: '12pm' },
	{ value: '13:00', label: '1pm' },
	{ value: '14:00', label: '2pm' },
];

const LUNCH_END_TIMES = [
	{ value: '12:00', label: '12pm' },
	{ value: '13:00', label: '1pm' },
	{ value: '14:00', label: '2pm' },
	{ value: '15:00', label: '3pm' },
];

const DAYS_SHORT = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
const DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const MODES = [
	{ value: 'HYBRID', label: 'HYBRID' },
	{ value: 'IN_PERSON', label: 'IN PERSON' },
	{ value: 'ONLINE', label: 'ONLINE' },
] as const;

const loadInitialPrefs = () => {
	const stored = localStorage.getItem('MTT.auto-timetable-preferences');
	if (stored) {
		try {
			const parsed = JSON.parse(stored);
			return {
				earliestStart: parsed.earliestStart ?? '09:00',
				latestEnd: parsed.latestEnd ?? '21:00',
				preferredDays: parsed.preferredDays ?? DAYS_FULL,
				preferredBreak: parsed.preferredBreak ?? 0,
				maxDays: parsed.maxDays ?? 5,
				mode: parsed.mode ?? 'HYBRID',
				ignoreLectures: parsed.ignoreLectures ?? false,
				enableLunch: parsed.enableLunch ?? false,
				lunchStart: parsed.lunchStart ?? '12:00',
				lunchEnd: parsed.lunchEnd ?? '13:00',
			};
		} catch {
			// Ignore malformed preferences
		}
	}
	return {
		earliestStart: '09:00',
		latestEnd: '21:00',
		preferredDays: DAYS_FULL,
		preferredBreak: 0,
		maxDays: 5,
		mode: 'HYBRID',
		ignoreLectures: false,
		enableLunch: false,
		lunchStart: '12:00',
		lunchEnd: '13:00',
	};
};

export const AutoTimetable = () => {
	const { t } = useTranslation();
	const coursesInfo = useCoursesInfo();
	const updateCourseClass = useEnrolledCourses((s) => s.updateCourseClass);

	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isMobile, setIsMobile] = useState(() => {
		if (typeof window !== 'undefined') {
			return window.matchMedia('(max-width: 767px)').matches;
		}
		return false;
	});

	useEffect(() => {
		const media = window.matchMedia('(max-width: 767px)');
		const listener = (e: MediaQueryListEvent) => setIsMobile(e.matches);
		media.addEventListener('change', listener);
		return () => media.removeEventListener('change', listener);
	}, []);

	const [initialPrefs] = useState(loadInitialPrefs);
	const [earliestStart, setEarliestStart] = useState(
		initialPrefs.earliestStart,
	);
	const [latestEnd, setLatestEnd] = useState(initialPrefs.latestEnd);
	const [preferredDays, setPreferredDays] = useState<string[]>(
		initialPrefs.preferredDays,
	);
	const [preferredBreak, setPreferredBreak] = useState(
		initialPrefs.preferredBreak,
	); // in hours
	const [maxDays, setMaxDays] = useState(initialPrefs.maxDays);
	const [mode, setMode] = useState<'HYBRID' | 'IN_PERSON' | 'ONLINE'>(
		initialPrefs.mode,
	);
	const [ignoreLectures, setIgnoreLectures] = useState(
		initialPrefs.ignoreLectures,
	);
	const [enableLunch, setEnableLunch] = useState(initialPrefs.enableLunch);
	const [lunchStart, setLunchStart] = useState(initialPrefs.lunchStart);
	const [lunchEnd, setLunchEnd] = useState(initialPrefs.lunchEnd);

	const savePrefs = (updated: Partial<typeof initialPrefs>) => {
		const current = {
			earliestStart,
			latestEnd,
			preferredDays,
			preferredBreak,
			maxDays,
			mode,
			ignoreLectures,
			enableLunch,
			lunchStart,
			lunchEnd,
			...updated,
		};
		localStorage.setItem(
			'MTT.auto-timetable-preferences',
			JSON.stringify(current),
		);
	};

	const toggleDay = (day: string) => {
		const nextDays = preferredDays.includes(day)
			? preferredDays.filter((d) => d !== day)
			: [...preferredDays, day];
		setPreferredDays(nextDays);
		savePrefs({ preferredDays: nextDays });
	};

	const handleGo = () => {
		if (coursesInfo.length === 0) {
			toast.warning('Please enroll in some courses first!');
			return;
		}

		setIsLoading(true);

		// Yield control to the browser to display the spinner/loading visual
		setTimeout(() => {
			const variables = coursesToVariables(coursesInfo);
			const prefs = {
				earliestStart,
				latestEnd,
				preferredDays,
				preferredBreak,
				maxDays,
				mode,
				ignoreLectures,
				enableLunch,
				lunchStart,
				lunchEnd,
			};
			const result = solveAutoTimetable(variables, prefs);

			if (result) {
				Object.entries(result).forEach(([classTypeId, classNumber]) => {
					const course = coursesInfo.find((c) =>
						c.class_list.some((ct) => ct.id === classTypeId),
					);
					if (course) {
						updateCourseClass({
							courseId: course.id,
							classTypeId,
							classNumber,
						});
					}
				});

				const violations = checkViolations(result, variables, prefs, t);

				if (violations.length > 0) {
					toast.warning(
						<div className="flex flex-col gap-1.5 p-0.5">
							<div className="text-sm font-semibold">
								{t('toast.auto-timetable-warning-title', {
									defaultValue: 'Some preferences could not be met',
								})}
							</div>
							<div className="text-xs leading-normal opacity-90">
								{t('toast.auto-timetable-warning-desc', {
									defaultValue:
										"Since most courses only offer classes on specific days or times, we couldn't satisfy all of your preferences:",
								})}
							</div>
							<ul className="mt-1 list-disc space-y-1 pl-4 text-xs">
								{violations.map((v, i) => (
									<li key={i}>{v}</li>
								))}
							</ul>
						</div>,
						{
							duration: 8000,
						},
					);
				} else {
					toast.success(
						t('toast.auto-timetable-applied', {
							defaultValue: 'Optimal timetable applied!',
						}),
					);
				}
				setIsOpen(false);
			} else {
				toast.error(
					t('toast.auto-timetable-failed', {
						defaultValue: 'Failed to find a valid timetable layout.',
					}),
				);
			}
			setIsLoading(false);
		}, 50);
	};

	const renderContent = () => {
		return (
			<div className="flex w-full flex-col gap-4">
				{/* Info section */}
				<div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-xs leading-relaxed text-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
					<FaInfoCircle className="mt-0.5 shrink-0 text-sm" />
					<span>
						Calculate your optimal class schedule based on daily preferences
						automatically.
					</span>
				</div>

				{/* Earliest start time */}
				<div className="flex items-center justify-between gap-2">
					<span className="text-default-700 text-xs font-semibold">
						Earliest start time
					</span>
					<Select
						size="sm"
						selectedKeys={[earliestStart]}
						onChange={(e) => {
							setEarliestStart(e.target.value);
							savePrefs({ earliestStart: e.target.value });
						}}
						className="w-28"
						disallowEmptySelection
						aria-label="Earliest start time"
					>
						{START_TIMES.map((t) => (
							<SelectItem key={t.value} textValue={t.label}>
								{t.label}
							</SelectItem>
						))}
					</Select>
				</div>

				{/* Latest end time */}
				<div className="flex items-center justify-between gap-2">
					<span className="text-default-700 text-xs font-semibold">
						Latest end time
					</span>
					<Select
						size="sm"
						selectedKeys={[latestEnd]}
						onChange={(e) => {
							setLatestEnd(e.target.value);
							savePrefs({ latestEnd: e.target.value });
						}}
						className="w-28"
						disallowEmptySelection
						aria-label="Latest end time"
					>
						{END_TIMES.map((t) => (
							<SelectItem key={t.value} textValue={t.label}>
								{t.label}
							</SelectItem>
						))}
					</Select>
				</div>

				{/* Preferred lunch break */}
				<div className="flex items-center justify-between gap-2">
					<span className="text-default-700 text-xs font-semibold">
						Preferred lunch break
					</span>
					<Switch
						isSelected={enableLunch}
						onValueChange={(val) => {
							setEnableLunch(val);
							savePrefs({ enableLunch: val });
						}}
						size="sm"
						aria-label="Enable preferred lunch break"
					/>
				</div>

				{/* Lunch start and end times */}
				{enableLunch && (
					<>
						<div className="flex items-center justify-between gap-2 pl-4">
							<span className="text-default-600 text-2xs font-medium">
								Lunch start time
							</span>
							<Select
								size="sm"
								selectedKeys={[lunchStart]}
								onChange={(e) => {
									setLunchStart(e.target.value);
									savePrefs({ lunchStart: e.target.value });
								}}
								className="w-28"
								disallowEmptySelection
								aria-label="Lunch start time"
							>
								{LUNCH_START_TIMES.map((t) => (
									<SelectItem key={t.value} textValue={t.label}>
										{t.label}
									</SelectItem>
								))}
							</Select>
						</div>

						<div className="flex items-center justify-between gap-2 pl-4">
							<span className="text-default-600 text-2xs font-medium">
								Lunch end time
							</span>
							<Select
								size="sm"
								selectedKeys={[lunchEnd]}
								onChange={(e) => {
									setLunchEnd(e.target.value);
									savePrefs({ lunchEnd: e.target.value });
								}}
								className="w-28"
								disallowEmptySelection
								aria-label="Lunch end time"
							>
								{LUNCH_END_TIMES.map((t) => (
									<SelectItem key={t.value} textValue={t.label}>
										{t.label}
									</SelectItem>
								))}
							</Select>
						</div>
					</>
				)}

				{/* Days selection */}
				<div className="flex flex-col gap-1.5">
					<span className="text-default-700 text-xs font-semibold">Days</span>
					<div className="border-default-200 divide-default-200 flex divide-x overflow-hidden rounded-lg border">
						{DAYS_SHORT.map((day, idx) => {
							const fullDay = DAYS_FULL[idx];
							const isSelected = preferredDays.includes(fullDay);
							return (
								<button
									key={day}
									type="button"
									onClick={() => toggleDay(fullDay)}
									className={`flex-1 py-1.5 text-xs font-semibold transition-colors ${
										isSelected
											? 'bg-default-200 text-default-800 dark:bg-default-300 dark:text-default-900'
											: 'text-default-400 hover:bg-default-50 bg-transparent'
									}`}
								>
									{day}
								</button>
							);
						})}
					</div>
				</div>

				{/* Breaks Slider */}
				<div className="flex flex-col gap-1">
					<div className="text-default-700 flex items-center justify-between text-xs font-semibold">
						<span>Breaks between classes</span>
						<span className="text-default-500">{preferredBreak} hrs</span>
					</div>
					<Slider
						step={0.5}
						maxValue={4}
						minValue={0}
						value={preferredBreak}
						onChange={(val) => {
							const num = val as number;
							setPreferredBreak(num);
							savePrefs({ preferredBreak: num });
						}}
						aria-label="Breaks between classes"
						size="sm"
						classNames={{
							track: 'border-s-primary-100',
							filler: 'bg-primary',
						}}
					/>
				</div>

				{/* Max Days Slider */}
				<div className="flex flex-col gap-1">
					<div className="text-default-700 flex items-center justify-between text-xs font-semibold">
						<span>Max days of Uni</span>
						<span className="text-default-500">{maxDays} days</span>
					</div>
					<Slider
						step={1}
						maxValue={5}
						minValue={1}
						value={maxDays}
						onChange={(val) => {
							const num = val as number;
							setMaxDays(num);
							savePrefs({ maxDays: num });
						}}
						aria-label="Max days of Uni"
						size="sm"
						classNames={{
							track: 'border-s-primary-100',
							filler: 'bg-primary',
						}}
					/>
				</div>

				{/* Mode Segmented Select */}
				<div className="flex flex-col gap-1.5">
					<span className="text-default-700 text-xs font-semibold">Mode</span>
					<div className="border-default-200 divide-default-200 flex divide-x overflow-hidden rounded-lg border">
						{MODES.map((m) => {
							const isSelected = mode === m.value;
							const tooltipContent =
								m.value === 'HYBRID'
									? 'No preference for in-person or online classes'
									: m.value === 'IN_PERSON'
										? 'Prioritizes physically attending classes on campus'
										: 'Prioritizes online/web-based class options';
							return (
								<Tooltip
									key={m.value}
									content={tooltipContent}
									size="sm"
									delay={100}
									closeDelay={100}
								>
									<button
										type="button"
										onClick={() => {
											setMode(m.value);
											savePrefs({ mode: m.value });
										}}
										className={`flex-1 py-1.5 text-xs font-semibold transition-colors ${
											isSelected
												? 'bg-default-200 text-default-800 dark:bg-default-300 dark:text-default-900'
												: 'text-default-400 hover:bg-default-50 bg-transparent'
										}`}
									>
										{m.label}
									</button>
								</Tooltip>
							);
						})}
					</div>
				</div>

				{/* Toggle for Lectures */}
				<div className="flex items-center justify-between gap-2">
					<span className="text-default-700 text-xs leading-snug font-semibold">
						{t('auto-timetable.allow-lecture-clashes', {
							defaultValue: 'Allow lecture clashes',
						})}
					</span>
					<Switch
						isSelected={ignoreLectures}
						onValueChange={(val) => {
							setIgnoreLectures(val);
							savePrefs({ ignoreLectures: val });
						}}
						size="sm"
						aria-label="Ignore lectures"
					/>
				</div>

				{/* GO Button */}
				<Button
					color="primary"
					onPress={handleGo}
					className="flex w-full gap-2 font-bold"
					size="md"
					isLoading={isLoading}
				>
					{!isLoading && <FaBolt />}
					<span>{isLoading ? 'GENERATING...' : 'GO'}</span>
				</Button>
			</div>
		);
	};

	const triggerButton = (
		<Button
			color="primary"
			variant="solid"
			className="flex gap-2 font-bold"
			size="sm"
			onPress={() => setIsOpen(true)}
		>
			<FaBolt />
			<span>AUTO-TIMETABLE</span>
			<FaChevronDown className="text-xs opacity-70" />
		</Button>
	);

	if (isMobile) {
		return (
			<>
				{triggerButton}
				<Drawer
					className="z-100"
					isOpen={isOpen}
					onOpenChange={setIsOpen}
					placement="bottom"
				>
					<DrawerContent>
						<DrawerHeader className="border-default-100 flex flex-col gap-1 border-b">
							<div className="flex items-center gap-2">
								<FaBolt className="text-primary text-sm" />
								<span className="text-sm font-bold">
									{t('auto-timetable.title', {
										defaultValue: 'Auto-Timetable Preferences',
									})}
								</span>
							</div>
						</DrawerHeader>
						<DrawerBody className="pb-8">{renderContent()}</DrawerBody>
					</DrawerContent>
				</Drawer>
			</>
		);
	}

	return (
		<Popover
			isOpen={isOpen}
			onOpenChange={setIsOpen}
			placement="bottom-end"
			shouldCloseOnScroll={false}
		>
			<PopoverTrigger>{triggerButton}</PopoverTrigger>
			<PopoverContent className="w-80 p-4">{renderContent()}</PopoverContent>
		</Popover>
	);
};
