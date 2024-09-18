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
} from '@nextui-org/react';
import type dayjs from 'dayjs';
import { Fragment } from 'react/jsx-runtime';

import { useGetCourseInfo } from '../data/course-info';
import { useEnrolledCourse } from '../data/enrolled-courses';
import type { Meetings } from '../types/course';
import type { Key } from '../types/key';
import { dateToDayjs, timeToDayjs } from '../utils/dayjs';

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
}: {
	meetings: Meetings;
	classType: string;
}) => {
	return (
		<Table aria-label={`${classType} Meetings Table`}>
			<TableHeader>
				<TableColumn>Dates</TableColumn>
				<TableColumn>Days</TableColumn>
				<TableColumn>Time</TableColumn>
				<TableColumn>Location</TableColumn>
			</TableHeader>
			<TableBody>
				{meetings.map((meeting, i) => (
					<TableRow key={i}>
						<TableCell>{getDisplayDate(meeting.date)}</TableCell>
						<TableCell>{meeting.day}</TableCell>
						<TableCell>{getDisplayTime(meeting.time)}</TableCell>
						<TableCell>{meeting.location}</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
};

const getPreviewMeetingInfo = (meetings: Meetings) => {
	const displayMeetings = meetings.map(
		(m) => `${m.day} ${getDisplayTime(m.time)}`,
	);
	return [...new Set(displayMeetings)].join(' & ');
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

	if (!courseInfo) return;
	return (
		<Modal
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			size="2xl"
			scrollBehavior="inside"
		>
			<ModalContent>
				{() => (
					<>
						<ModalHeader className="flex flex-col gap-1">
							{courseInfo.name.subject} {courseInfo.name.code} -{' '}
							{courseInfo.name.title}
						</ModalHeader>
						<ModalBody className="mb-4">
							{courseInfo.class_list.map((classType) => (
								<Fragment key={classType.id}>
									<Select
										label={`${classType.type} Time`}
										renderValue={(value) => 'Class Number: ' + value[0].key}
										selectedKeys={getKeys(getSelectedClassNumber(classType.id))}
										// Prevent the selected class from being clicked again to avoid it becoming undefined
										disabledKeys={getKeys(getSelectedClassNumber(classType.id))}
										onSelectionChange={(selectedClassNumber) => {
											updateClass({
												classNumber: [...selectedClassNumber][0] as string,
												classTypeId: classType.id,
											});
										}}
									>
										{classType.classes.map((classInfo) => (
											<SelectItem
												key={classInfo.number}
												textValue={classInfo.number}
											>
												<div>
													<div>{classInfo.number}</div>
													<div className="text-tiny text-default-500">
														{getPreviewMeetingInfo(classInfo.meetings)}
													</div>
												</div>
											</SelectItem>
										))}
									</Select>
									<MeetingsTime
										meetings={getMeetings(classType.id)}
										classType={classType.type}
									/>
								</Fragment>
							))}
						</ModalBody>
					</>
				)}
			</ModalContent>
		</Modal>
	);
};
