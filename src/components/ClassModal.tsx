import { Modal, Table, Tooltip } from '@heroui/react';
import { useTranslation } from 'react-i18next';
import { FaExclamationTriangle } from 'react-icons/fa';

import { useGetCourseInfo, useGetCourseClasses } from '../data/course-info';
import { useDetailedEnrolledCourses } from '../data/enrolled-courses';
import { findConflicts } from '../helpers/conflicts';
import type { ConflictDetail } from '../helpers/conflicts';
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

interface ClassTableItem {
	id: number;
	dates: string;
	day: string;
	time: string;
	location: string;
	campus: string;
	availability: string;
	isFull: boolean;
}

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
	const tableItems: ClassTableItem[] = groupedMeetings.map((group, i) => {
		const sample = group[0];
		const dates = deduplicateArray(
			group.map((m) => getDisplayDate(m.date)),
		).join(', ');
		const isFull =
			availableSeats !== undefined && parseInt(availableSeats, 10) === 0;
		return {
			id: i,
			dates,
			day: sample.day,
			time: getDisplayTime(sample.time),
			location: sample.location,
			campus: sample.campus,
			availability: availableSeats && size ? `${availableSeats} / ${size}` : '',
			isFull,
		};
	});
	return (
		<Table className="border-separator overflow-hidden rounded-xl border shadow-sm">
			<Table.ScrollContainer>
				<Table.Content aria-label={t('class-modal.meetings-table') as string}>
					<Table.Header className="bg-default-100">
						<Table.Column
							isRowHeader
							className="text-default-500 rounded-none! text-xs font-semibold"
						>
							{t('class-modal.dates')}
						</Table.Column>
						<Table.Column className="text-default-500 rounded-none! text-xs font-semibold">
							{t('class-modal.days')}
						</Table.Column>
						<Table.Column className="text-default-500 rounded-none! text-xs font-semibold">
							{t('class-modal.time')}
						</Table.Column>
						<Table.Column className="text-default-500 rounded-none! text-xs font-semibold">
							{t('class-modal.location')}
						</Table.Column>
						<Table.Column className="text-default-500 rounded-none! text-xs font-semibold">
							{t('class-modal.campus')}
						</Table.Column>
						<Table.Column className="text-default-500 rounded-none! text-xs font-semibold">
							{t('class-modal.availability')}
						</Table.Column>
					</Table.Header>
					<Table.Body items={tableItems}>
						{(item: ClassTableItem) => (
							<Table.Row
								key={item.id}
								className="border-separator bg-background hover:bg-default-50 border-b text-sm transition-colors last:border-b-0"
							>
								<Table.Cell className="text-foreground rounded-none! py-3">
									{item.dates}
								</Table.Cell>
								<Table.Cell className="text-foreground rounded-none! py-3">
									{item.day}
								</Table.Cell>
								<Table.Cell className="text-foreground rounded-none! py-3">
									{item.time}
								</Table.Cell>
								<Table.Cell className="text-foreground rounded-none! py-3">
									{item.location}
								</Table.Cell>
								<Table.Cell className="text-foreground rounded-none! py-3">
									{item.campus}
								</Table.Cell>
								<Table.Cell className="rounded-none! py-3">
									{item.availability ? (
										<span
											className={
												item.isFull
													? 'text-danger font-bold'
													: 'text-foreground font-semibold'
											}
										>
											{item.availability}
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
	const detailed = useDetailedEnrolledCourses();
	const { conflictsByClassKey } = findConflicts(detailed);
	if (!courseInfo || !classList) return null;
	const selected = classList.find((c) => c.number === classNumber);
	const meetings = selected?.meetings ?? [];
	const classTypeName =
		courseInfo.class_list.find((ct) => ct.id === classTypeId)?.type ??
		classTypeId;
	const size = selected?.size ?? selected?.section ?? undefined;
	const availableSeats = selected?.available_seats ?? undefined;

	const meetingInstructors = Array.from(
		new Set(
			selected?.meetings
				?.map((m) => m.instructor)
				.filter((i) => i && i.trim() !== '') ?? [],
		),
	);
	const instructor =
		selected?.instructor ||
		(meetingInstructors.length > 0 ? meetingInstructors.join(', ') : undefined);

	const courseUrl = courseInfo.course_url;

	return (
		<Modal.Backdrop
			variant="opaque"
			isOpen={isOpen}
			onOpenChange={onOpenChange}
		>
			<Modal.Container size="lg">
				<Modal.Dialog className="bg-background border-separator w-full max-w-3xl rounded-3xl border p-6 shadow-2xl">
					<Modal.CloseTrigger className="hover:bg-default-100 rounded-full" />
					<header className="contents">
						<Modal.Header className="border-separator/50 mb-4 flex w-full flex-col gap-1 border-b pb-2">
							<Modal.Heading className="text-xl font-bold">
								{courseUrl ? (
									<a
										href={courseUrl}
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
							<div className="text-default-500 mt-1 text-sm">
								<span className="flex items-center gap-2">
									{availableSeats !== undefined &&
										parseInt(availableSeats, 10) === 0 && (
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
													{t('calendar.no-available-seats', {
														defaultValue: 'Class full',
													})}
												</Tooltip.Content>
											</Tooltip>
										)}
									<span>
										{`${classTypeName} | ${t('class-modal.number')} ${classNumber} | ${t('class-modal.section')} ${selected?.section}`}
										{instructor
											? ` | ${Array.isArray(instructor) ? instructor.join(', ') : instructor}`
											: ''}
									</span>
								</span>
							</div>
						</Modal.Header>
					</header>
					<Modal.Body className="gap-4">
						{(() => {
							const classKey = `${courseId}|${classTypeId}|${classNumber}`;
							const classConflicts = conflictsByClassKey[classKey] ?? [];
							if (classConflicts.length === 0) return null;
							const unique: typeof classConflicts = [];
							const seen = new Set<string>();
							for (const c of classConflicts) {
								const k = `${c.otherCourseId}|${c.otherClassNumber}|${c.otherMeeting.time.start}|${c.otherMeeting.time.end}|${c.otherMeeting.location}|${c.otherMeeting.campus}`;
								if (!seen.has(k)) {
									seen.add(k);
									unique.push(c);
								}
							}
							return (
								<div className="border-warning/30 bg-warning/10 dark:bg-warning/5 text-foreground mb-4 rounded-2xl border p-4">
									<div className="text-warning mb-2 flex items-center gap-2 font-bold">
										<FaExclamationTriangle />
										<span>{t('class-modal.conflicts') ?? 'Conflicts'}</span>
									</div>
									<ul className="list-disc space-y-1 pl-5 text-sm">
										{unique.map((c: ConflictDetail, i: number) => (
											<li
												key={i}
											>{`${c.otherCourseCode} (${c.otherClassNumber}) — ${c.otherMeeting.time.start} - ${c.otherMeeting.time.end} @ ${c.otherMeeting.location}`}</li>
										))}
									</ul>
								</div>
							);
						})()}
						<MeetingsTime
							meetings={meetings}
							size={size}
							availableSeats={availableSeats}
						/>
					</Modal.Body>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
};

export default ClassModal;
