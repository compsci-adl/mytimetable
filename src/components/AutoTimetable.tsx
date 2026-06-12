import {
	Button,
	Drawer,
	Label,
	ListBox,
	Popover,
	Select,
	Slider,
	Switch,
	Tooltip,
} from '@heroui/react';
import clsx from 'clsx';
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

interface AutoTimetableProps {
	className?: string;
	isDisabled?: boolean;
}

export const AutoTimetable = ({
	className,
	isDisabled,
}: AutoTimetableProps = {}) => {
	const { t } = useTranslation();
	const coursesInfo = useCoursesInfo();
	const updateCourseClass = useEnrolledCourses((s) => s.updateCourseClass);

	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const media = window.matchMedia('(max-width: 767px)');
		const isCurrentlyMobile = media.matches;
		const id = setTimeout(() => {
			setIsMobile(isCurrentlyMobile);
		}, 0);
		const listener = (e: MediaQueryListEvent) => setIsMobile(e.matches);
		media.addEventListener('change', listener);
		return () => {
			clearTimeout(id);
			media.removeEventListener('change', listener);
		};
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
				<div className="bg-primary/10 border-primary/20 dark:bg-primary/5 flex items-start gap-2 rounded-lg border p-3 text-xs leading-relaxed text-orange-800 dark:text-orange-200">
					<FaInfoCircle className="text-primary mt-0.5 shrink-0 text-sm" />
					<span>
						Calculate your optimal class schedule based on daily preferences
						automatically.
					</span>
				</div>

				{/* Earliest start time */}
				<div className="flex items-center justify-between gap-2">
					<span className="text-foreground text-xs font-bold">
						Earliest start time
					</span>
					<Select
						aria-label="Earliest start time"
						value={earliestStart}
						onChange={(val) => {
							if (!val) return;
							setEarliestStart(String(val));
							savePrefs({ earliestStart: String(val) });
						}}
						variant="secondary"
						className="flex w-28 flex-col gap-1.5"
					>
						<Select.Trigger>
							<Select.Value className="text-xs" />
							<Select.Indicator />
						</Select.Trigger>
						<Select.Popover className="bg-content1 border-separator rounded-2xl border p-1 shadow-lg">
							<ListBox className="max-h-48 overflow-y-auto outline-none">
								{START_TIMES.map((t) => (
									<ListBox.Item
										key={t.value}
										id={t.value}
										textValue={t.label}
										className="focus:bg-default-100 hover:bg-default-100/50 text-foreground cursor-pointer rounded-xl px-3 py-2 transition-colors outline-none"
									>
										{t.label}
									</ListBox.Item>
								))}
							</ListBox>
						</Select.Popover>
					</Select>
				</div>

				{/* Latest end time */}
				<div className="flex items-center justify-between gap-2">
					<span className="text-foreground text-xs font-bold">
						Latest end time
					</span>
					<Select
						aria-label="Latest end time"
						value={latestEnd}
						onChange={(val) => {
							if (!val) return;
							setLatestEnd(String(val));
							savePrefs({ latestEnd: String(val) });
						}}
						variant="secondary"
						className="flex w-28 flex-col gap-1.5"
					>
						<Select.Trigger>
							<Select.Value className="text-xs" />
							<Select.Indicator />
						</Select.Trigger>
						<Select.Popover className="bg-content1 border-separator rounded-2xl border p-1 shadow-lg">
							<ListBox className="max-h-48 overflow-y-auto outline-none">
								{END_TIMES.map((t) => (
									<ListBox.Item
										key={t.value}
										id={t.value}
										textValue={t.label}
										className="focus:bg-default-100 hover:bg-default-100/50 text-foreground cursor-pointer rounded-xl px-3 py-2 transition-colors outline-none"
									>
										{t.label}
									</ListBox.Item>
								))}
							</ListBox>
						</Select.Popover>
					</Select>
				</div>

				{/* Preferred lunch break */}
				<div className="flex items-center justify-between gap-2">
					<span className="text-foreground text-xs font-bold">
						Preferred lunch break
					</span>
					<Switch
						isSelected={enableLunch}
						onChange={(val) => {
							setEnableLunch(val);
							savePrefs({ enableLunch: val });
						}}
						aria-label="Enable preferred lunch break"
					>
						<Switch.Control>
							<Switch.Thumb />
						</Switch.Control>
					</Switch>
				</div>

				{/* Lunch start and end times */}
				{enableLunch && (
					<div className="border-separator/80 flex flex-col gap-3 border-l pl-4">
						<div className="flex items-center justify-between gap-2">
							<span className="text-default-500 text-2xs font-semibold">
								Lunch start time
							</span>
							<Select
								aria-label="Lunch start time"
								value={lunchStart}
								onChange={(val) => {
									if (!val) return;
									setLunchStart(String(val));
									savePrefs({ lunchStart: String(val) });
								}}
								variant="secondary"
								className="flex w-28 flex-col gap-1.5"
							>
								<Select.Trigger>
									<Select.Value className="text-xs" />
									<Select.Indicator />
								</Select.Trigger>
								<Select.Popover className="bg-content1 border-separator rounded-2xl border p-1 shadow-lg">
									<ListBox className="max-h-48 overflow-y-auto outline-none">
										{LUNCH_START_TIMES.map((t) => (
											<ListBox.Item
												key={t.value}
												id={t.value}
												textValue={t.label}
												className="focus:bg-default-100 hover:bg-default-100/50 text-foreground cursor-pointer rounded-xl px-3 py-2 transition-colors outline-none"
											>
												{t.label}
											</ListBox.Item>
										))}
									</ListBox>
								</Select.Popover>
							</Select>
						</div>

						<div className="flex items-center justify-between gap-2">
							<span className="text-default-500 text-2xs font-semibold">
								Lunch end time
							</span>
							<Select
								aria-label="Lunch end time"
								value={lunchEnd}
								onChange={(val) => {
									if (!val) return;
									setLunchEnd(String(val));
									savePrefs({ lunchEnd: String(val) });
								}}
								variant="secondary"
								className="flex w-28 flex-col gap-1.5"
							>
								<Select.Trigger>
									<Select.Value className="text-xs" />
									<Select.Indicator />
								</Select.Trigger>
								<Select.Popover className="bg-content1 border-separator rounded-2xl border p-1 shadow-lg">
									<ListBox className="max-h-48 overflow-y-auto outline-none">
										{LUNCH_END_TIMES.map((t) => (
											<ListBox.Item
												key={t.value}
												id={t.value}
												textValue={t.label}
												className="focus:bg-default-100 hover:bg-default-100/50 text-foreground cursor-pointer rounded-xl px-3 py-2 transition-colors outline-none"
											>
												{t.label}
											</ListBox.Item>
										))}
									</ListBox>
								</Select.Popover>
							</Select>
						</div>
					</div>
				)}

				{/* Days selection */}
				<div className="flex flex-col gap-1.5">
					<span className="text-foreground text-xs font-bold">Days</span>
					<div className="border-separator divide-separator bg-content2/10 flex divide-x overflow-hidden rounded-xl border">
						{DAYS_SHORT.map((day, idx) => {
							const fullDay = DAYS_FULL[idx];
							const isSelected = preferredDays.includes(fullDay);
							return (
								<button
									key={day}
									type="button"
									onClick={() => toggleDay(fullDay)}
									className={`flex-1 cursor-pointer py-2 text-xs font-bold transition-colors ${
										isSelected
											? 'bg-default-200 text-foreground dark:bg-default-300'
											: 'text-default-400 hover:bg-default-100/50 bg-transparent'
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
					>
						<Label className="text-foreground text-xs font-bold">
							Breaks between classes
						</Label>
						<Slider.Output className="text-default-500 text-xs font-bold">{`${preferredBreak} hrs`}</Slider.Output>
						<Slider.Track>
							<Slider.Fill />
							<Slider.Thumb className="bg-default-300 after:bg-default-300! dark:bg-default-300 border-background cursor-grab border-2 shadow-md active:cursor-grabbing" />
						</Slider.Track>
					</Slider>
				</div>

				{/* Max Days Slider */}
				<div className="flex flex-col gap-1">
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
					>
						<Label className="text-foreground text-xs font-bold">
							Max days of Uni
						</Label>
						<Slider.Output className="text-default-500 text-xs font-bold">{`${maxDays} days`}</Slider.Output>
						<Slider.Track>
							<Slider.Fill />
							<Slider.Thumb className="bg-default-300 after:bg-default-300! border-background cursor-grab border-2 shadow-md active:cursor-grabbing" />
						</Slider.Track>
					</Slider>
				</div>

				{/* Mode Segmented Select */}
				<div className="flex flex-col gap-1.5">
					<span className="text-foreground text-xs font-bold">Mode</span>
					<div className="border-separator divide-separator bg-content2/10 flex divide-x overflow-hidden rounded-xl border">
						{MODES.map((m) => {
							const isSelected = mode === m.value;
							const tooltipContent =
								m.value === 'HYBRID'
									? 'No preference for in-person or online classes'
									: m.value === 'IN_PERSON'
										? 'Prioritizes physically attending classes on campus'
										: 'Prioritizes online/web-based class options';
							return (
								<Tooltip key={m.value} delay={100} closeDelay={100}>
									<Tooltip.Trigger className="flex flex-1 flex-grow">
										<button
											type="button"
											onClick={() => {
												setMode(m.value);
												savePrefs({ mode: m.value });
											}}
											className={`w-full cursor-pointer py-2 text-xs font-bold transition-colors ${
												isSelected
													? 'bg-default-200 text-foreground dark:bg-default-300'
													: 'text-default-400 hover:bg-default-100/50 bg-transparent'
											}`}
										>
											{m.label}
										</button>
									</Tooltip.Trigger>
									<Tooltip.Content>{tooltipContent}</Tooltip.Content>
								</Tooltip>
							);
						})}
					</div>
				</div>

				{/* Toggle for Lectures */}
				<div className="flex items-center justify-between gap-2">
					<span className="text-foreground text-xs leading-snug font-bold">
						{t('auto-timetable.allow-lecture-clashes', {
							defaultValue: 'Allow lecture clashes',
						})}
					</span>
					<Switch
						isSelected={ignoreLectures}
						onChange={(val) => {
							setIgnoreLectures(val);
							savePrefs({ ignoreLectures: val });
						}}
						aria-label="Ignore lectures"
					>
						<Switch.Control>
							<Switch.Thumb />
						</Switch.Control>
					</Switch>
				</div>

				{/* GO Button */}
				<Button
					variant="primary"
					onPress={handleGo}
					className="flex w-full gap-2 rounded-full py-2.5 font-bold shadow-md"
					size="md"
					isPending={isLoading}
				>
					{!isLoading && <FaBolt />}
					<span>{isLoading ? 'GENERATING...' : 'GO'}</span>
				</Button>
			</div>
		);
	};

	if (isMobile) {
		return (
			<>
				<Button
					variant="primary"
					className={clsx(
						'flex h-8 gap-2 rounded-full font-bold shadow-md',
						className,
					)}
					size="sm"
					onPress={() => setIsOpen(true)}
					isDisabled={isDisabled}
				>
					<FaBolt />
					<span>AUTO-TIMETABLE</span>
					<FaChevronDown className="text-xs opacity-70" />
				</Button>
				<Drawer>
					<Drawer.Backdrop
						isOpen={isOpen}
						onOpenChange={setIsOpen}
						variant="opaque"
						className="z-100"
					>
						<Drawer.Content placement="bottom">
							<Drawer.Dialog className="bg-background border-separator max-h-[85vh] overflow-y-auto rounded-t-3xl border-t p-6 pb-12 shadow-2xl">
								<Drawer.Handle />
								<Drawer.Header className="border-separator/50 flex flex-col gap-1 border-b pb-2">
									<Drawer.Heading className="text-foreground flex items-center gap-2 text-xl font-bold">
										<FaBolt className="text-primary animate-pulse text-sm" />
										<span>
											{t('auto-timetable.title', {
												defaultValue: 'Auto-Timetable Preferences',
											})}
										</span>
									</Drawer.Heading>
								</Drawer.Header>
								<Drawer.Body className="pt-4">{renderContent()}</Drawer.Body>
							</Drawer.Dialog>
						</Drawer.Content>
					</Drawer.Backdrop>
				</Drawer>
			</>
		);
	}

	return (
		<Popover isOpen={isOpen} onOpenChange={setIsOpen}>
			<Popover.Trigger
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				render={(props: any) => (
					<Button
						{...props}
						variant="primary"
						className="flex gap-2 rounded-full font-bold shadow-md"
						size="sm"
						isDisabled={isDisabled}
					/>
				)}
			>
				<FaBolt />
				<span>AUTO-TIMETABLE</span>
				<FaChevronDown className="text-xs opacity-70" />
			</Popover.Trigger>
			<Popover.Content placement="bottom end">
				<Popover.Dialog className="bg-background border-separator w-80 rounded-3xl border p-5 shadow-2xl">
					{renderContent()}
				</Popover.Dialog>
			</Popover.Content>
		</Popover>
	);
};
