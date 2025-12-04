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
} from '@heroui/react';
import { useTranslation } from 'react-i18next';
import { Fragment } from 'react/jsx-runtime';

import { useGetCourseInfo } from '../data/course-info';
import { useEnrolledCourse } from '../data/enrolled-courses';
import type dayjs from '../lib/dayjs';
import type { Meetings } from '../types/course';
import type { Key } from '../types/key';
import { dateToDayjs, timeToDayjs } from '../utils/date';
import { deduplicateArray } from '../utils/deduplicate-array';

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
									{availableSeats && size ? `${availableSeats} / ${size}` : ''}
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
													return `Class Number: ${key}`;
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
													const campusList = deduplicateArray(
														classInfo.meetings
															.map((m) => m.campus ?? '')
															.filter(Boolean),
													).join(', ');
													return (
														<SelectItem
															key={classInfo.number}
															textValue={classInfo.number}
														>
															<div>
																<div>{classInfo.number}</div>
																<div className="text-tiny text-default-500">
																	{getPreviewMeetingInfo(classInfo.meetings)}
																	{campusList ? ` | ${campusList}` : ''}
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
											return (
												<MeetingsTime
													meetings={getMeetings(classType.id)}
													classType={classType.type}
													size={size}
													availableSeats={availableSeats}
												/>
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
