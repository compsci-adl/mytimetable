import {
	Modal,
	ModalBody,
	ModalContent,
	ModalHeader,
	Select,
	SelectItem,
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
	Tooltip,
} from '@heroui/react';
import { useTranslation } from 'react-i18next';
import { Fragment } from 'react/jsx-runtime';

import { useGetCourseInfo } from '../data/course-info';
import {
	useEnrolledCourse,
	useDetailedEnrolledCourses,
} from '../data/enrolled-courses';
import { findConflicts } from '../helpers/conflicts';
import type { ConflictDetail } from '../helpers/conflicts';
import type dayjs from '../lib/dayjs';
import type { Meetings } from '../types/course';
import type { Key } from '../types/key';
import { dateToDayjs, timeToDayjs } from '../utils/date';
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
const MeetingsTime = ({
	meetings,
	classType,
	size,
	availableSeats,
}: {
	meetings: Meetings;
	classType: string;
	size?: string | undefined;
	availableSeats?: string | undefined;
}) => {
	const { t } = useTranslation();
	const isFullValue =
		availableSeats !== undefined && parseInt(availableSeats, 10) === 0;

	return (
		<Table aria-label={`${classType} Meetings Table`}>
			<TableHeader>
				<TableColumn>{t('course-modal.dates')}</TableColumn>
				<TableColumn>{t('course-modal.days')}</TableColumn>
				<TableColumn>{t('course-modal.time')}</TableColumn>
				<TableColumn>{t('course-modal.location')}</TableColumn>
				<TableColumn>{t('course-modal.campus')}</TableColumn>
				<TableColumn>{t('course-modal.availability')}</TableColumn>
			</TableHeader>
			<TableBody>
				{/* Group meetings that are identical except for the date */}
				{(() => {
					const grouped: Record<string, Meetings> = {};
					const order: string[] = [];
					meetings.forEach((m) => {
						const key = [
							m.day,
							m.time.start,
							m.time.end,
							m.location,
							m.campus,
						].join('|');
						if (!grouped[key]) {
							grouped[key] = [];
							order.push(key);
						}
						grouped[key].push(m);
					});
					return order.map((k, i) => {
						const group = grouped[k];
						const sample = group[0];
						const dates = deduplicateArray(
							group.map((m) => getDisplayDate(m.date)),
						).join(', ');
						return (
							<TableRow key={i}>
								<TableCell>{dates}</TableCell>
								<TableCell>{sample.day}</TableCell>
								<TableCell>{getDisplayTime(sample.time)}</TableCell>
								<TableCell>{sample.location}</TableCell>
								<TableCell>{sample.campus}</TableCell>
								<TableCell>
									{availableSeats && size ? (
										<span className={isFullValue ? 'text-danger' : ''}>
											{`${availableSeats} / ${size}`}
										</span>
									) : (
										''
									)}
								</TableCell>
							</TableRow>
						);
					});
				})()}
			</TableBody>
		</Table>
	);
};

const getPreviewMeetingInfo = (meetings: Meetings) => {
	const displayMeetings = meetings.map(
		(m) => `${m.day} ${getDisplayTime(m.time)}`,
	);
	return deduplicateArray(displayMeetings).join(', ');
};
const getKeys = (nullableKey: Key | undefined) => {
	return nullableKey ? [nullableKey] : undefined;
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

	if (!courseInfo) return;
	const detailedCourses = detailed; // Alias for clarity

	const classConflictsWithEnrolled = (meetings: Meetings) => {
		for (const ec of detailedCourses) {
			for (const cl of ec.classes) {
				for (const m1 of meetings) {
					for (const m2 of cl.meetings) {
						if (m1.day === m2.day && timeOverlap(m1.time, m2.time)) {
							return true;
						}
					}
				}
			}
		}
		return false;
	};
	return (
		<Modal
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			size="3xl"
			scrollBehavior="inside"
		>
			<ModalContent>
				{() => (
					<>
						<ModalHeader className="flex flex-col gap-1">
							{courseInfo.name.code} - {courseInfo.name.title}
						</ModalHeader>
						<ModalBody className="mb-4">
							{(() => {
								// Gather conflicts for all selected classes in this course
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
									<div className="mb-4 rounded-md border border-yellow-300 bg-yellow-50 p-4 dark:bg-yellow-600 dark:text-slate-100">
										<div className="mb-2 font-semibold">
											<span aria-hidden className="mr-2">
												⚠️
											</span>
											{t('course-modal.conflicts-with-other-classes') ??
												'Conflicts with other classes'}
										</div>
										<ul className="list-disc pl-5">
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
								return courseInfo.class_list.map((classType) => (
									<Fragment key={classType.id}>
										{classType.classes.length === 0 ? (
											<div className="text-default-500">
												{t('course-modal.no-class-info-class-type') ??
													'No class information for this class type at the moment.'}
											</div>
										) : (
											<Select
												label={`${classType.type} Time`}
												renderValue={(value) => {
													const items = value as unknown as
														| Array<{ key?: Key }>
														| undefined;
													const key = items?.[0]?.key as string | undefined;
													const selectedClass = getSelectedClass(classType.id);
													const isFullSelected =
														selectedClass?.available_seats !== undefined &&
														parseInt(selectedClass.available_seats, 10) === 0;
													return (
														<div className="flex items-center gap-2">
															{isFullSelected && (
																<Tooltip
																	content={
																		t('calendar.no-available-seats', {
																			defaultValue: 'Class full',
																		}) as string
																	}
																	size="sm"
																>
																	<span aria-hidden>⚠️</span>
																</Tooltip>
															)}
															{(() => {
																const selKey = key
																	? `${id}|${classType.id}|${key}`
																	: undefined;
																const selConf =
																	(selKey
																		? (conflictsByClassKey[selKey] ?? [])
																				.length > 0
																		: false) ||
																	(selectedClass
																		? classConflictsWithEnrolled(
																				selectedClass.meetings,
																			)
																		: false);
																return (
																	selConf && (
																		<Tooltip
																			content={
																				t('calendar.conflict') ??
																				'Conflict with another class'
																			}
																			size="sm"
																		>
																			<span aria-hidden className="">
																				⚠️
																			</span>
																		</Tooltip>
																	)
																);
															})()}
															<div>{`Class Number: ${key}`}</div>
														</div>
													);
												}}
												selectedKeys={getKeys(
													getSelectedClassNumber(classType.id),
												)}
												// Prevent the selected class from being clicked again to avoid it becoming undefined
												disabledKeys={getKeys(
													getSelectedClassNumber(classType.id),
												)}
												onSelectionChange={(selectedClassNumber) => {
													updateClass({
														classNumber: [...selectedClassNumber][0] as string,
														classTypeId: classType.id,
													});
												}}
											>
												{classType.classes.map((classInfo) => {
													const itemKey = `${id}|${classType.id}|${classInfo.number}`;
													const itemConflicted =
														(conflictsByClassKey[itemKey] ?? []).length > 0 ||
														classConflictsWithEnrolled(classInfo.meetings);
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
													return (
														<SelectItem
															key={classInfo.number}
															textValue={classInfo.number}
														>
															<div>
																<div className="flex items-center">
																	{itemConflicted && (
																		<Tooltip
																			content={
																				t('calendar.conflict') ??
																				'Conflict with another class'
																			}
																			size="sm"
																		>
																			<span aria-hidden className="mr-2">
																				⚠️
																			</span>
																		</Tooltip>
																	)}
																	{isFull && (
																		<Tooltip
																			content={
																				t('calendar.no-available-seats', {
																					defaultValue: 'Class full',
																				}) as string
																			}
																			size="sm"
																		>
																			<span aria-hidden>⚠️</span>
																		</Tooltip>
																	)}
																	<div>{classInfo.number}</div>
																</div>
																<div className="text-tiny text-default-500">
																	{getPreviewMeetingInfo(classInfo.meetings)}
																	{campusList ? ` | ${campusList}` : ''}
																	{availability ? (
																		<>
																			{' '}
																			|{' '}
																			<span
																				className={isFull ? 'text-danger' : ''}
																			>
																				{availability}
																			</span>
																		</>
																	) : (
																		''
																	)}
																</div>
															</div>
														</SelectItem>
													);
												})}
											</Select>
										)}
										{(() => {
											const selectedClass = getSelectedClass(classType.id);
											const size =
												selectedClass?.size ??
												selectedClass?.section ??
												undefined;
											const availableSeats =
												selectedClass?.available_seats ?? undefined;
											const selectedClassNumber = getSelectedClassNumber(
												classType.id,
											);
											const classKey = selectedClassNumber
												? `${id}|${classType.id}|${selectedClassNumber}`
												: undefined;
											const classConflicts = classKey
												? (conflictsByClassKey[classKey] ?? [])
												: [];
											// Dedupe again defensively by serialised key
											const unique = [] as typeof classConflicts;
											const seen = new Set<string>();
											for (const c of classConflicts) {
												const k = `${c.otherCourseId}|${c.otherClassNumber}|${c.otherMeeting.time.start}|${c.otherMeeting.time.end}|${c.otherMeeting.location}|${c.otherMeeting.campus}`;
												if (!seen.has(k)) {
													seen.add(k);
													unique.push(c);
												}
											}
											return (
												<>
													<MeetingsTime
														meetings={getMeetings(classType.id)}
														classType={classType.type}
														size={size}
														availableSeats={availableSeats}
													/>
												</>
											);
										})()}
									</Fragment>
								));
							})()}
						</ModalBody>
					</>
				)}
			</ModalContent>
		</Modal>
	);
};
