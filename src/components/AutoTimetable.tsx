import {
	Button,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Select,
	SelectItem,
	Slider,
	Switch,
} from '@heroui/react';
import { useState } from 'react';
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
	{ value: '07:00', label: '07 AM' },
	{ value: '08:00', label: '08 AM' },
	{ value: '09:00', label: '09 AM' },
	{ value: '10:00', label: '10 AM' },
	{ value: '11:00', label: '11 AM' },
	{ value: '12:00', label: '12 PM' },
];

const END_TIMES = [
	{ value: '15:00', label: '03 PM' },
	{ value: '16:00', label: '04 PM' },
	{ value: '17:00', label: '05 PM' },
	{ value: '18:00', label: '06 PM' },
	{ value: '19:00', label: '07 PM' },
	{ value: '20:00', label: '08 PM' },
	{ value: '21:00', label: '09 PM' },
];

const DAYS_SHORT = ['MO', 'TU', 'WE', 'TH', 'FR'];
const DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const MODES = [
	{ value: 'HYBRID', label: 'HYBRID' },
	{ value: 'IN_PERSON', label: 'IN PERSON' },
	{ value: 'ONLINE', label: 'ONLINE' },
] as const;

export const AutoTimetable = () => {
	const { t } = useTranslation();
	const coursesInfo = useCoursesInfo();
	const updateCourseClass = useEnrolledCourses((s) => s.updateCourseClass);

	const [isOpen, setIsOpen] = useState(false);
	const [earliestStart, setEarliestStart] = useState('09:00');
	const [latestEnd, setLatestEnd] = useState('21:00');
	const [preferredDays, setPreferredDays] = useState<string[]>(DAYS_FULL);
	const [preferredBreak, setPreferredBreak] = useState(0); // in hours
	const [maxDays, setMaxDays] = useState(5);
	const [mode, setMode] = useState<'HYBRID' | 'IN_PERSON' | 'ONLINE'>('HYBRID');
	const [ignoreLectures, setIgnoreLectures] = useState(false);

	const toggleDay = (day: string) => {
		setPreferredDays((prev) =>
			prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
		);
	};

	const handleGo = () => {
		if (coursesInfo.length === 0) {
			toast.warning('Please enroll in some courses first!');
			return;
		}

		const variables = coursesToVariables(coursesInfo);
		const prefs = {
			earliestStart,
			latestEnd,
			preferredDays,
			preferredBreak,
			maxDays,
			mode,
			ignoreLectures,
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

			const violations = checkViolations(result, variables, prefs);

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
	};

	return (
		<Popover isOpen={isOpen} onOpenChange={setIsOpen} placement="bottom-end">
			<PopoverTrigger>
				<Button
					color="primary"
					variant="solid"
					className="flex gap-2 font-bold"
					size="sm"
				>
					<FaBolt />
					<span>AUTO-TIMETABLE</span>
					<FaChevronDown className="text-xs opacity-70" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80 p-4">
				<div className="flex w-full flex-col gap-4">
					{/* Info section */}
					<div className="bg-primary-50 text-primary-700 dark:bg-primary-950/30 dark:text-primary-300 flex items-start gap-2 rounded-lg p-3 text-xs leading-relaxed">
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
							onChange={(e) => setEarliestStart(e.target.value)}
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
							onChange={(e) => setLatestEnd(e.target.value)}
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
							onChange={(val) => setPreferredBreak(val as number)}
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
							onChange={(val) => setMaxDays(val as number)}
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
								return (
									<button
										key={m.value}
										type="button"
										onClick={() => setMode(m.value)}
										className={`flex-1 py-1.5 text-xs font-semibold transition-colors ${
											isSelected
												? 'bg-default-200 text-default-800 dark:bg-default-300 dark:text-default-900'
												: 'text-default-400 hover:bg-default-50 bg-transparent'
										}`}
									>
										{m.label}
									</button>
								);
							})}
						</div>
					</div>

					{/* Toggle for Lectures */}
					<div className="flex items-center justify-between gap-2">
						<span className="text-default-700 text-xs leading-snug font-semibold">
							{"Don't care about attending lectures live"}
						</span>
						<Switch
							isSelected={ignoreLectures}
							onValueChange={setIgnoreLectures}
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
					>
						<FaBolt />
						<span>GO</span>
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	);
};
