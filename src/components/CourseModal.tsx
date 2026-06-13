import { Modal, Select, ListBox, Table, Tooltip, Button } from '@heroui/react';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	FaChevronDown,
	FaExclamationTriangle,
	FaSpinner,
} from 'react-icons/fa';

import { useGetCourseInfo } from '../data/course-info';
import {
	useEnrolledCourse,
	useDetailedEnrolledCourses,
} from '../data/enrolled-courses';
import { useFilters } from '../data/filters';
import { findConflicts } from '../helpers/conflicts';
import type { ConflictDetail } from '../helpers/conflicts';
import type dayjs from '../lib/dayjs';
import type { Course, Meetings } from '../types/course';
import {
	dateToDayjs,
	timeToDayjs,
	isMeetingInTerm,
	dateRangesOverlap,
} from '../utils/date';
import { deduplicateArray } from '../utils/deduplicate-array';
import { timeOverlap } from '../utils/time-overlap';

const DATE_FORMAT = 'D MMM';
const TIME_FORMAT = 'h:mm A';
const TIME_FORMAT_SHORT = 'h A';
const getDisplayDate = (date: { start: string; end: string }) => {
	const start = dateToDayjs(date.start);
	const end = dateToDayjs(date.end);
	if (start.isSame(end, 'day')) {
		return start.format(DATE_FORMAT);
	}
	return `${start.format(DATE_FORMAT)} - ${end.format(DATE_FORMAT)}`;
};
const formatTime = (time: dayjs.Dayjs) => {
	return time.minute() === 0
		? time.format(TIME_FORMAT_SHORT)
		: time.format(TIME_FORMAT);
};
const getDisplayTime = (time: { start: string; end: string }) => {
	const start = timeToDayjs(time.start);
	const end = timeToDayjs(time.end);
	return `${formatTime(start)} - ${formatTime(end)}`;
};

interface CourseRowItem {
	id: string | number;
	dates: string;
	day: string;
	time: string;
	location: string;
	campus: string;
	availability: string;
	isFull: boolean;
}

type CourseClass = Course['class_list'][number]['classes'][number];

interface CourseListBoxItem {
	id: string;
	isNotAvailable: boolean;
	label: string;
	itemConflicted: boolean;
	campusList: string;
	availability: string | undefined;
	isFull: boolean;
	classInfo: CourseClass | null;
}

const MeetingsTime = ({
	meetings,
	classType,
	size,
	availableSeats,
	courseCampus,
}: {
	meetings: Meetings;
	classType: string;
	size?: string | undefined;
	availableSeats?: string | undefined;
	courseCampus?: string | undefined;
}) => {
	const { t } = useTranslation();

	const isFullValue =
		availableSeats !== undefined && parseInt(availableSeats, 10) === 0;

	const rows: CourseRowItem[] = [];

	if (meetings.length === 0) {
		const notAvailableStr = t('course-modal.not-available', {
			defaultValue: 'Not available',
		});
		rows.push({
			id: 'no-meetings',
			dates: notAvailableStr,
			day: notAvailableStr,
			time: notAvailableStr,
			location: notAvailableStr,
			campus: courseCampus || notAvailableStr,
			availability:
				availableSeats && size
					? `${availableSeats} / ${size}`
					: notAvailableStr,
			isFull: isFullValue,
		});
	} else {
		const grouped: Record<string, Meetings> = {};
		const order: string[] = [];
		meetings.forEach((m) => {
			const key = [m.day, m.time.start, m.time.end, m.location, m.campus].join(
				'|',
			);
			if (!grouped[key]) {
				grouped[key] = [];
				order.push(key);
			}
			grouped[key].push(m);
		});

		order.forEach((k, i) => {
			const group = grouped[k];
			const sample = group[0];
			const dates = deduplicateArray(
				group.map((m) => getDisplayDate(m.date)),
			).join(', ');

			const availabilityStr =
				availableSeats && size ? `${availableSeats} / ${size}` : '';

			rows.push({
				id: i,
				dates,
				day: sample.day,
				time: getDisplayTime(sample.time),
				location: sample.location,
				campus: sample.campus,
				availability: availabilityStr,
				isFull: isFullValue,
			});
		});
	}
	return (
		<Table className="border-separator mt-2 overflow-hidden rounded-xl border shadow-sm">
			<Table.ScrollContainer>
				<Table.Content aria-label={`${classType} Meetings Table`}>
					<Table.Header className="bg-default-100">
						<Table.Column
							isRowHeader
							className="text-default-500 rounded-none! text-xs font-semibold"
						>
							{t('course-modal.dates')}
						</Table.Column>
						<Table.Column className="text-default-500 rounded-none! text-xs font-semibold">
							{t('course-modal.days')}
						</Table.Column>
						<Table.Column className="text-default-500 rounded-none! text-xs font-semibold">
							{t('course-modal.time')}
						</Table.Column>
						<Table.Column className="text-default-500 rounded-none! text-xs font-semibold">
							{t('course-modal.location')}
						</Table.Column>
						<Table.Column className="text-default-500 rounded-none! text-xs font-semibold">
							{t('course-modal.campus')}
						</Table.Column>
						<Table.Column className="text-default-500 rounded-none! text-xs font-semibold">
							{t('course-modal.availability')}
						</Table.Column>
					</Table.Header>
					<Table.Body items={rows}>
						{(row: CourseRowItem) => (
							<Table.Row
								key={row.id}
								className="border-separator bg-background hover:bg-default-50 border-b text-sm transition-colors last:border-b-0"
							>
								<Table.Cell className="text-foreground rounded-none! py-3">
									{row.dates}
								</Table.Cell>
								<Table.Cell className="text-foreground rounded-none! py-3">
									{row.day}
								</Table.Cell>
								<Table.Cell className="text-foreground rounded-none! py-3">
									{row.time}
								</Table.Cell>
								<Table.Cell className="text-foreground rounded-none! py-3">
									{row.location}
								</Table.Cell>
								<Table.Cell className="text-foreground rounded-none! py-3">
									{row.campus}
								</Table.Cell>
								<Table.Cell className="rounded-none! py-3">
									{row.availability ? (
										<span
											className={
												row.isFull
													? 'text-danger font-bold'
													: 'text-foreground font-semibold'
											}
										>
											{row.availability}
										</span>
									) : (
										''
									)}
								</Table.Cell>
							</Table.Row>
						)}
					</Table.Body>
				</Table.Content>
			</Table.ScrollContainer>
		</Table>
	);
};

const getPreviewMeetingInfo = (meetings: Meetings) => {
	const displayMeetings = meetings.map(
		(m) => `${m.day} ${getDisplayTime(m.time)}`,
	);
	return deduplicateArray(displayMeetings).join(', ');
};

const CollapsibleSection = ({
	title,
	children,
	defaultExpanded = false,
}: {
	title: string;
	children: React.ReactNode;
	defaultExpanded?: boolean;
}) => {
	return (
		<details className="group mt-2 text-sm" open={defaultExpanded}>
			<summary className="hover:text-primary border-separator/50 flex w-full cursor-pointer list-none items-center justify-between border-b py-2 text-left font-semibold transition-colors">
				<span>{title}</span>
				<FaChevronDown className="text-default-500 text-xs transition-transform duration-300 group-open:rotate-180" />
			</summary>
			<div className="pt-2 pb-3 transition-all duration-300 ease-in-out">
				{children}
			</div>
		</details>
	);
};

type CourseModalProps = {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	id: string;
};

export const CourseModal = ({ isOpen, onOpenChange, id }: CourseModalProps) => {
	const courseInfo = useGetCourseInfo(id);
	const { t } = useTranslation();
	const { course, updateClass } = useEnrolledCourse(id);
	const detailed = useDetailedEnrolledCourses();
	const selectedTermAlias = useFilters((s) => s.term);
	const selectedCampuses = useFilters((s) => s.campuses);
	const { conflictsByClassKey } = findConflicts(detailed);
	const getSelectedClassNumber = (classTypeId: string) => {
		const selectedClass = course?.classes.find((c) => c.id === classTypeId);
		return selectedClass?.classNumber;
	};
	const getMeetings = (classTypeId: string) => {
		const selectedClassNumber = getSelectedClassNumber(classTypeId);
		if (!selectedClassNumber) return [];
		const selectedClass = courseInfo?.class_list
			.find((c) => c.id === classTypeId)
			?.classes.find((c) => c.number === selectedClassNumber);
		return selectedClass?.meetings ?? [];
	};
	const getSelectedClass = (classTypeId: string) => {
		const selectedClassNumber = getSelectedClassNumber(classTypeId);
		if (!selectedClassNumber) return undefined;
		const selectedClass = courseInfo?.class_list
			.find((c) => c.id === classTypeId)
			?.classes.find((c) => c.number === selectedClassNumber);
		return selectedClass;
	};

	const detailedCourses = detailed;

	const [overviewExpanded, setOverviewExpanded] = useState(false);
	const [charLimit, setCharLimit] = useState(220);

	useEffect(() => {
		const updateLimit = () => {
			setCharLimit(window.innerWidth < 768 ? 160 : 220);
		};
		updateLimit();
		window.addEventListener('resize', updateLimit);
		return () => window.removeEventListener('resize', updateLimit);
	}, []);

	const classConflictsWithEnrolled = (
		meetings: Meetings,
		classTypeId: string,
	) => {
		for (const ec of detailedCourses) {
			for (const cl of ec.classes) {
				if (ec.id === id && cl.typeId === classTypeId) continue;
				for (const m1 of meetings) {
					for (const m2 of cl.meetings) {
						if (
							m1.day === m2.day &&
							dateRangesOverlap(m1.date, m2.date) &&
							timeOverlap(m1.time, m2.time)
						) {
							return true;
						}
					}
				}
			}
		}
		return false;
	};

	return (
		<Modal.Backdrop
			variant="opaque"
			isOpen={isOpen}
			onOpenChange={onOpenChange}
		>
			<Modal.Container size="lg">
				<Modal.Dialog className="bg-background border-separator w-full max-w-3xl rounded-3xl border p-6 shadow-2xl">
					<Modal.CloseTrigger className="hover:bg-default-100 rounded-full" />
					{!courseInfo ? (
						<div className="flex h-40 items-center justify-center">
							<FaSpinner className="text-primary animate-spin text-2xl" />
						</div>
					) : (
						<>
							<header className="contents">
								<Modal.Header className="border-separator/50 flex w-full flex-col gap-1 border-b pb-2">
									<Modal.Heading className="text-foreground text-xl font-black">
										{courseInfo.url || courseInfo.course_url ? (
											<a
												href={courseInfo.url || courseInfo.course_url}
												target="_blank"
												rel="noopener noreferrer"
												className="hover:text-primary text-foreground flex w-fit underline transition-colors"
											>
												{courseInfo.name.code} - {courseInfo.name.title}
											</a>
										) : (
											<div className="text-foreground flex w-fit">
												{courseInfo.name.code} - {courseInfo.name.title}
											</div>
										)}
									</Modal.Heading>
									<div className="text-default-500 mt-2 text-sm">
										{t('course-modal.level_of_study')}:{' '}
										<span className="text-foreground font-semibold">
											{courseInfo.level_of_study
												? courseInfo.level_of_study
												: 'None listed'}
										</span>
									</div>
									<div className="text-default-500 text-sm">
										{t('course-modal.course_coordinator')}:{' '}
										<span className="text-foreground font-semibold">
											{courseInfo.course_coordinator
												? courseInfo.course_coordinator
												: 'None listed'}
										</span>
									</div>
									<div className="text-default-500 text-sm">
										{t('course-modal.university-wide-elective')}:{' '}
										<span className="text-foreground font-semibold">
											{courseInfo.university_wide_elective ? 'True' : 'False'}
										</span>
									</div>
									<div className="text-default-500 mt-1 text-sm">
										{t('course-modal.course_overview')}:{' '}
										<div className="relative mt-1">
											<div
												className={clsx(
													'text-foreground overflow-hidden font-normal transition-[max-height] duration-300 ease-in-out',
													overviewExpanded ? 'max-h-250' : 'max-h-13.75',
												)}
											>
												{courseInfo.course_overview || 'None listed'}
											</div>
											{!overviewExpanded &&
												courseInfo.course_overview &&
												courseInfo.course_overview.length > charLimit && (
													<div className="from-background absolute bottom-0 left-0 h-6 w-full bg-linear-to-t to-transparent" />
												)}
										</div>
										{courseInfo.course_overview &&
											courseInfo.course_overview.length > charLimit && (
												<Button
													variant="tertiary"
													className="text-primary mt-1.5 h-auto min-w-0 cursor-pointer bg-transparent p-0 font-bold underline shadow-none"
													onPress={() => setOverviewExpanded(!overviewExpanded)}
												>
													{overviewExpanded
														? t('course.overview.show-less')
														: t('course.overview.show-more')}
												</Button>
											)}
									</div>
									{(() => {
										const outcomes =
											courseInfo.learning_outcomes &&
											Array.isArray(courseInfo.learning_outcomes)
												? courseInfo.learning_outcomes.filter(
														(o: {
															description: string;
															outcome_index: number;
														}) => o.description && o.description.trim() !== '',
													)
												: [];

										if (outcomes.length === 0) return null;

										return (
											<CollapsibleSection
												title={
													t('course-modal.learning-outcomes') ??
													'Learning Outcomes'
												}
											>
												<ul className="mt-1 list-disc space-y-1 pl-5">
													{outcomes.map(
														(
															outcome: {
																description: string;
																outcome_index: number;
															},
															index: number,
														) => (
															<li
																key={index}
																className="text-foreground font-normal"
															>
																{outcome.description}
															</li>
														),
													)}
												</ul>
											</CollapsibleSection>
										);
									})()}
									{courseInfo.textbooks &&
										Array.isArray(courseInfo.textbooks) &&
										courseInfo.textbooks.length > 0 && (
											<div className="text-default-500 mt-2 text-sm">
												<div className="text-foreground font-bold">
													{t('course-modal.textbooks') ?? 'Textbooks'}:
												</div>
												<ul className="mt-1 list-disc space-y-1 pl-5">
													{courseInfo.textbooks.map(
														(textbook: string, index: number) => (
															<li
																key={index}
																className="text-foreground font-normal"
															>
																{textbook}
															</li>
														),
													)}
												</ul>
											</div>
										)}
									{(() => {
										const assessments =
											courseInfo.assessments &&
											Array.isArray(courseInfo.assessments)
												? courseInfo.assessments
												: [];

										if (assessments.length === 0) return null;

										return (
											<CollapsibleSection
												title={t('course-modal.assessments') ?? 'Assessments'}
											>
												<div className="border-separator bg-content1 mt-1 overflow-x-auto rounded-2xl border">
													<table className="w-full border-collapse text-left text-sm">
														<thead>
															<tr className="border-separator bg-content2 border-b">
																<th className="text-foreground px-3 py-2 font-bold">
																	{t('course-modal.assessment-name') ?? 'Name'}
																</th>
																<th className="text-foreground px-3 py-2 font-bold">
																	{t('course-modal.assessment-weight') ??
																		'Weight'}
																</th>
																<th className="text-foreground px-3 py-2 font-bold">
																	{t('course-modal.assessment-hurdle') ??
																		'Hurdle'}
																</th>
																<th className="text-foreground px-3 py-2 font-bold">
																	{t(
																		'course-modal.assessment-learning-outcomes',
																	) ?? 'Learning Outcomes'}
																</th>
															</tr>
														</thead>
														<tbody>
															{assessments.map(
																(
																	assessment: {
																		name?: string;
																		title?: string;
																		weight?: string;
																		weighting?: string;
																		due_date?: string;
																		hurdle?: string;
																		learning_outcomes?: string;
																	},
																	index: number,
																) => (
																	<tr
																		key={index}
																		className="border-separator hover:bg-default-100/30 border-b transition-colors last:border-b-0"
																	>
																		<td className="text-foreground px-3 py-2 font-semibold">
																			{assessment.name ||
																				assessment.title ||
																				'-'}
																		</td>
																		<td className="text-default-600 px-3 py-2">
																			{assessment.weight ||
																				assessment.weighting ||
																				'-'}
																		</td>
																		<td className="text-default-600 px-3 py-2">
																			{assessment.hurdle || '-'}
																		</td>
																		<td className="text-default-600 px-3 py-2">
																			{assessment.learning_outcomes || '-'}
																		</td>
																	</tr>
																),
															)}
														</tbody>
													</table>
												</div>
											</CollapsibleSection>
										);
									})()}
								</Modal.Header>
							</header>
							<Modal.Body className="mt-4 mb-4 max-h-100 gap-4 overflow-y-auto pr-2">
								{(() => {
									const aggregated: ConflictDetail[] = [];
									const seen = new Set<string>();
									for (const ct of courseInfo.class_list) {
										const selectedNumber = course?.classes.find(
											(c) => c.id === ct.id,
										)?.classNumber;
										if (!selectedNumber) continue;
										const key = `${id}|${ct.id}|${selectedNumber}`;
										const items = conflictsByClassKey[key] ?? [];
										for (const it of items) {
											const k = `${it.otherCourseId}|${it.otherClassNumber}|${it.otherMeeting.time.start}|${it.otherMeeting.time.end}|${it.otherMeeting.location}|${it.otherMeeting.campus}`;
											if (!seen.has(k)) {
												seen.add(k);
												aggregated.push(it);
											}
										}
									}
									if (aggregated.length === 0) return null;
									return (
										<div className="border-warning/30 bg-warning/10 dark:bg-warning/5 text-foreground mb-2 rounded-2xl border p-4">
											<div className="text-warning mb-2 flex items-center gap-2 font-bold">
												<FaExclamationTriangle />
												<span>
													{t('course-modal.conflicts-with-other-classes') ??
														'Conflicts with other classes'}
												</span>
											</div>
											<ul className="list-disc space-y-1 pl-5 text-sm">
												{aggregated.map((c, i) => (
													<li
														key={i}
													>{`${c.otherCourseCode} (${c.otherClassNumber}) — ${c.otherMeeting.time.start} - ${c.otherMeeting.time.end} @ ${c.otherMeeting.location}`}</li>
												))}
											</ul>
										</div>
									);
								})()}
								{(() => {
									const hasClassInfo =
										!!courseInfo.class_list &&
										courseInfo.class_list.some(
											(ct) => ct.classes && ct.classes.length > 0,
										);
									if (!hasClassInfo) {
										return (
											<div className="text-default-500">
												{t('course-modal.no-class-info') ??
													'No available class information for now, check back later.'}
											</div>
										);
									}
									return courseInfo.class_list.map((classType) => {
										const classesToShow = classType.classes.filter(
											(classInfo) =>
												classInfo.meetings.some(
													(m) =>
														isMeetingInTerm(m.date, selectedTermAlias) &&
														(!selectedCampuses ||
															selectedCampuses.length === 0 ||
															selectedCampuses.includes(m.campus)),
												),
										);
										const isEmpty = classesToShow.length === 0;
										const selectedKey = getSelectedClassNumber(classType.id);

										const listBoxItems = (
											isEmpty
												? [
														{
															id: 'not-available',
															isNotAvailable: true,
															label: t('course-modal.not-available', {
																defaultValue: 'Not available',
															}),
															itemConflicted: false,
															campusList: '',
															availability: '',
															isFull: false,
															classInfo: null,
														},
													]
												: classesToShow.map((classInfo) => {
														const itemKey = `${id}|${classType.id}|${classInfo.number}`;
														const itemConflicted =
															(conflictsByClassKey[itemKey] ?? []).length > 0 ||
															classConflictsWithEnrolled(
																classInfo.meetings,
																classType.id,
															);
														const campusList = deduplicateArray(
															classInfo.meetings
																.map((m) => m.campus ?? '')
																.filter(Boolean),
														).join(', ');
														const availability =
															classInfo.available_seats && classInfo.size
																? `${classInfo.available_seats} / ${classInfo.size}`
																: undefined;
														const isFull =
															classInfo.available_seats !== undefined &&
															parseInt(classInfo.available_seats, 10) === 0;

														return {
															id: classInfo.number,
															isNotAvailable: false,
															label: classInfo.number,
															itemConflicted,
															campusList,
															availability,
															isFull,
															classInfo,
														};
													})
										) as Array<{
											id: string;
											isNotAvailable: boolean;
											label: string;
											itemConflicted: boolean;
											campusList: string;
											availability: string | undefined;
											isFull: boolean;
											classInfo: (typeof classType.classes)[number] | null;
										}>;

										return (
											<div
												key={classType.id}
												className="border-separator bg-content1/75 flex flex-col gap-2 rounded-2xl border p-4"
											>
												<div className="text-foreground text-sm font-bold">
													{classType.type} Time
												</div>
												<Select
													aria-label={`${classType.type} Time`}
													isDisabled={isEmpty}
													value={isEmpty ? 'not-available' : selectedKey}
													onChange={(val) => {
														if (isEmpty || !val) return;
														updateClass({
															classNumber: String(val),
															classTypeId: classType.id,
														});
													}}
													disabledKeys={
														isEmpty
															? ['not-available']
															: selectedKey
																? [selectedKey]
																: []
													}
												>
													<Select.Trigger className="border-separator bg-content2/30 hover:bg-content2/50 flex w-full items-center justify-between rounded-2xl border px-4 py-2.5 transition-colors">
														<Select.Value />
														<Select.Indicator>
															<FaChevronDown className="text-default-500 text-xs" />
														</Select.Indicator>
													</Select.Trigger>
													<Select.Popover>
														<ListBox
															className="bg-overlay border-separator max-h-75 overflow-y-auto rounded-2xl border p-2 shadow-xl"
															items={listBoxItems}
														>
															{(item: CourseListBoxItem) => {
																if (item.isNotAvailable) {
																	return (
																		<ListBox.Item
																			id="not-available"
																			textValue={item.label}
																			className="text-default-500 rounded-xl px-3 py-2"
																		>
																			{item.label}
																		</ListBox.Item>
																	);
																}

																return (
																	<ListBox.Item
																		id={item.id}
																		textValue={item.label}
																		className="hover:bg-default-100/50 text-foreground cursor-pointer rounded-xl px-3 py-2 transition-colors"
																	>
																		<div>
																			<div className="flex items-center gap-1.5">
																				{item.itemConflicted && (
																					<Tooltip delay={0}>
																						<Tooltip.Trigger>
																							<span
																								aria-hidden
																								className="text-warning flex items-center"
																							>
																								<FaExclamationTriangle />
																							</span>
																						</Tooltip.Trigger>
																						<Tooltip.Content>
																							{t('calendar.conflict') ??
																								'Conflict with another class'}
																						</Tooltip.Content>
																					</Tooltip>
																				)}
																				{item.isFull && (
																					<Tooltip delay={0}>
																						<Tooltip.Trigger>
																							<span
																								aria-hidden
																								className="text-danger flex items-center"
																							>
																								<FaExclamationTriangle />
																							</span>
																						</Tooltip.Trigger>
																						<Tooltip.Content>
																							{t(
																								'calendar.no-available-seats',
																								{
																									defaultValue: 'Class full',
																								},
																							)}
																						</Tooltip.Content>
																					</Tooltip>
																				)}
																				<div className="font-bold">
																					{item.label}
																				</div>
																			</div>
																			<div className="text-default-500 mt-0.5 text-xs">
																				{item.classInfo
																					? getPreviewMeetingInfo(
																							item.classInfo.meetings,
																						)
																					: ''}
																				{item.campusList
																					? ` | ${item.campusList}`
																					: ''}
																				{item.availability ? (
																					<>
																						{' | '}
																						<span
																							className={
																								item.isFull
																									? 'text-danger font-bold'
																									: ''
																							}
																						>
																							{item.availability}
																						</span>
																					</>
																				) : (
																					''
																				)}
																			</div>
																		</div>
																	</ListBox.Item>
																);
															}}
														</ListBox>
													</Select.Popover>
												</Select>
												{(() => {
													const selectedClass = getSelectedClass(classType.id);
													const size =
														selectedClass?.size ??
														selectedClass?.section ??
														undefined;
													const availableSeats =
														selectedClass?.available_seats ?? undefined;
													return (
														<MeetingsTime
															meetings={getMeetings(classType.id)}
															classType={classType.type}
															size={size}
															availableSeats={availableSeats}
															courseCampus={courseInfo?.campus}
														/>
													);
												})()}
											</div>
										);
									});
								})()}
							</Modal.Body>
						</>
					)}
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
};

export default CourseModal;
