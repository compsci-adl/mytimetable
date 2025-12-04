import {
	Modal,
	ModalBody,
	ModalContent,
	ModalHeader,
	Table,
	TableHeader,
	TableColumn,
	TableBody,
	TableRow,
	TableCell,
	Spacer,
	Tooltip,
} from '@heroui/react';
import { useTranslation } from 'react-i18next';

import { useGetCourseInfo, useGetCourseClasses } from '../data/course-info';
import type dayjs from '../lib/dayjs';
import type { Meetings } from '../types/course';
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
	size,
	availableSeats,
}: {
	meetings: Meetings;
	size?: string | undefined;
	availableSeats?: string | undefined;
}) => {
	const { t } = useTranslation();
	if (!meetings || meetings.length === 0)
		return (
			<div className="text-default-500">{t('class-modal.no-class-info')}</div>
		);
	// Group meetings that are identical except for the date
	const groupedMeetingsMap: Record<string, Meetings> = {};
	const groupedOrder: string[] = [];
	meetings.forEach((m) => {
		const key = [m.day, m.time.start, m.time.end, m.location, m.campus].join(
			'|',
		);
		if (!groupedMeetingsMap[key]) {
			groupedMeetingsMap[key] = [];
			groupedOrder.push(key);
		}
		groupedMeetingsMap[key].push(m);
	});
	const groupedMeetings = groupedOrder.map((k) => groupedMeetingsMap[k]);
	return (
		<Table aria-label={t('class-modal.meetings-table') as string}>
			<TableHeader>
				<TableColumn>{t('class-modal.dates')}</TableColumn>
				<TableColumn>{t('class-modal.days')}</TableColumn>
				<TableColumn>{t('class-modal.time')}</TableColumn>
				<TableColumn>{t('class-modal.location')}</TableColumn>
				<TableColumn>{t('class-modal.campus')}</TableColumn>
				<TableColumn>{t('class-modal.availability')}</TableColumn>
			</TableHeader>
			<TableBody>
				{groupedMeetings.map((group, i) => {
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
									<span
										className={
											availableSeats !== undefined &&
											parseInt(availableSeats, 10) === 0
												? 'text-danger'
												: ''
										}
									>
										{`${availableSeats} / ${size}`}
									</span>
								) : (
									''
								)}
							</TableCell>
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
};

type ClassModalProps = {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	courseId: string;
	classTypeId: string;
	classNumber: string;
};

export const ClassModal = ({
	isOpen,
	onOpenChange,
	courseId,
	classTypeId,
	classNumber,
}: ClassModalProps) => {
	const { t } = useTranslation();
	const courseInfo = useGetCourseInfo(courseId);
	const classList = useGetCourseClasses(courseId, classTypeId);
	if (!courseInfo || !classList) return null;
	const selected = classList.find((c) => c.number === classNumber);
	const meetings = selected?.meetings ?? [];
	const classTypeName =
		courseInfo.class_list.find((ct) => ct.id === classTypeId)?.type ??
		classTypeId;
	const size = selected?.size ?? selected?.section ?? undefined;
	const availableSeats = selected?.available_seats ?? undefined;

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
						<ModalHeader className="flex flex-col">
							{courseInfo.name.code} - {courseInfo.name.title}
							<div className="text-sm text-default-500">
								<span className="flex items-center gap-2">
									{availableSeats !== undefined &&
										parseInt(availableSeats, 10) === 0 && (
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
									<span>{`${classTypeName} | ${t('class-modal.class')} ${classNumber}`}</span>
								</span>
							</div>
						</ModalHeader>
						<ModalBody>
							<MeetingsTime
								meetings={meetings}
								size={size}
								availableSeats={availableSeats}
							/>
						</ModalBody>
						<Spacer />
						<Spacer />
						<Spacer />
					</>
				)}
			</ModalContent>
		</Modal>
	);
};

export default ClassModal;
