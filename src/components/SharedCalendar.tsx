import { Button } from '@heroui/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaPlus, FaTimes } from 'react-icons/fa';

import { COURSE_COLORS } from '../constants/course-colors';
import { useSharedTimetable } from '../data/shared-timetable';
import type { SharedCalendarMeeting } from '../helpers/share';
import { getMeetingsByDay } from '../helpers/share';

type ClassInfoModalProps = {
	meeting: SharedCalendarMeeting;
	modalOpen: boolean;
	setModalOpen: (value: boolean) => void;
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function formatDateRange(range: { start: string; end: string }) {
	const [startMonth, startDay] = range.start.split('-');
	const [endMonth, endDay] = range.end.split('-');
	const months = [
		'',
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec',
	];
	const startStr = `${parseInt(startDay)} ${months[parseInt(startMonth)]}`;
	const endStr = `${parseInt(endDay)} ${months[parseInt(endMonth)]}`;
	return range.start === range.end ? startStr : `${startStr} - ${endStr}`;
}

function formatTime(time: { start: string; end: string }) {
	const to12hr = (t: string) => {
		const [h, m] = t.split(':').map(Number);
		const ampm = h >= 12 ? 'PM' : 'AM';
		const hour = h % 12 === 0 ? 12 : h % 12;
		return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
	};
	return `${to12hr(time.start)} - ${to12hr(time.end)}`;
}

function ClassInfoModal({
	meeting,
	modalOpen,
	setModalOpen,
}: ClassInfoModalProps) {
	return (
		modalOpen && (
			<div className="relative mx-3 my-2 flex flex-col gap-2 rounded-lg">
				<Button
					isIconOnly
					onPress={() => setModalOpen(false)}
					className="dark:bg-default-100 dark:hover:bg-default-200 absolute -top-1 -right-1 rounded-full bg-slate-100 p-2 hover:bg-slate-200/80"
				>
					<FaTimes />
				</Button>
				<h1 className="mr-10 text-lg font-bold text-black dark:text-white">
					{meeting.courseName} - {meeting.title}
				</h1>
				<div className="-mt-1 mb-1 flex w-full items-center gap-2">
					<span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
						{meeting.classType} | Class Number {meeting.classNumber}
					</span>
				</div>
				<div className="dark:bg-default-100 w-full overflow-x-auto rounded-2xl bg-slate-100 p-4">
					<table className="w-full min-w-[500px] text-left">
						<thead>
							<tr className="text-sm text-slate-500 dark:text-slate-300">
								<th className="px-2 py-2 font-semibold">Dates</th>
								<th className="px-2 py-2 font-semibold">Day</th>
								<th className="px-2 py-2 font-semibold">Time</th>
								<th className="px-2 py-2 font-semibold">Location</th>
								<th className="px-2 py-2 font-semibold">Campus</th>
								<th className="px-2 py-2 font-semibold">Availability</th>
							</tr>
						</thead>
						<tbody>
							{meeting.dateRanges.map((range, idx) => (
								<tr
									key={idx}
									className="text-sm text-slate-800 dark:text-slate-100"
								>
									<td className="px-2 py-2">{formatDateRange(range)}</td>
									<td className="px-2 py-2">{meeting.day || '-'}</td>
									<td className="px-2 py-2">{formatTime(meeting.time)}</td>
									<td className="px-2 py-2">{meeting.location}</td>
									<td className="px-2 py-2">{meeting.campus}</td>
									<td className="px-2 py-2 font-semibold">
										<span
											className={
												meeting.available_seats === '0' ? 'text-red-500' : ''
											}
										>
											{meeting.available_seats ?? '-'} / {meeting.size ?? '-'}
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		)
	);
}

export default function SharedCalendar() {
	const { sharedTimetableData, showSharedTimetable, setShowSharedTimetable } =
		useSharedTimetable();
	const [meetingsByDay, setMeetingsByDay] = useState<Record<
		string,
		SharedCalendarMeeting[]
	> | null>(null);

	const [showClassModal, setShowClassModal] = useState(false);
	const [selectedClassInfo, setSelectedClassInfo] =
		useState<SharedCalendarMeeting | null>(null);

	const { t } = useTranslation();
	const DISPLAY_DAYS = t('calendar.week-days', {
		returnObjects: true,
	}) as string[];

	let currentColorIndex: number = 0;

	const sharedClassesColors: Map<
		string,
		{
			bg: string;
			border: string;
			text: string;
			dot: string;
		}
	> = new Map([]);

	const handleShowClassModal = (classInfo: SharedCalendarMeeting) => {
		setSelectedClassInfo(classInfo);
		setShowClassModal(true);
	};

	useEffect(() => {
		if (showSharedTimetable) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = 'unset';
		}
	}, [showSharedTimetable]);

	useEffect(() => {
		if (sharedTimetableData) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setMeetingsByDay(getMeetingsByDay(sharedTimetableData));
		}
	}, [sharedTimetableData]);

	if (!showSharedTimetable) return null;

	return (
		<div
			className="fixed inset-0 z-[51] -mb-[16px] flex items-center justify-center bg-black/60"
			onClick={() => setShowSharedTimetable(false)}
		>
			<div
				className="dark:bg-content1 dark:border-default-200 relative max-h-[80vh] min-h-[450px] w-[80vw] min-w-[375px] scale-95 transform rounded-2xl border-2 border-slate-400 bg-slate-50 shadow-2xl"
				onClick={(e) => e.stopPropagation()}
			>
				<Button
					isIconOnly
					onPress={() => setShowSharedTimetable(false)}
					className="bg-default-100 hover:bg-default-200 absolute top-4 right-4 z-10 rounded-full p-2 transition-colors"
				>
					<FaTimes />
				</Button>
				<div className="p-6">
					<h2 className="mb-2 mb-4 text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
						{t('shared-timetable.title')}
					</h2>
					<div className="scrollbar-thin max-h-[65vh] min-h-[350px] w-full overflow-auto pb-4">
						<div className="grid min-h-[450px] min-w-[1000px] grid-cols-5 gap-3">
							{meetingsByDay &&
								DAYS.map((day, idx) => (
									<div key={day} className="flex flex-col">
										<div
											className={`rounded-t-lg py-2 text-center text-base font-semibold`}
										>
											{DISPLAY_DAYS[idx]}
										</div>
										<div className="mt-1 flex flex-col gap-2">
											{meetingsByDay[day] && meetingsByDay[day].length === 0 ? (
												<div className="py-2 text-center text-xs text-slate-500">
													No classes
												</div>
											) : (
												meetingsByDay[day]?.map(
													(m: SharedCalendarMeeting, i: number) => {
														if (
															!sharedClassesColors.has(
																`${m.subject}-${m.title}`,
															)
														) {
															sharedClassesColors.set(
																`${m.subject}-${m.title}`,
																COURSE_COLORS[currentColorIndex],
															);
															currentColorIndex =
																(currentColorIndex + 1) % COURSE_COLORS.length;
														}
														const color = sharedClassesColors.get(
															`${m.subject}-${m.title}`,
														)!;

														return (
															<div
																key={i}
																className={`relative rounded-lg border p-2 pb-6 text-xs font-medium shadow-sm ${color.bg} ${color.border} ${color.text} flex flex-col gap-0.5`}
																style={{ borderLeftWidth: 6 }}
															>
																<div className="text-sm font-bold">
																	<span>{m.courseName + ' '}</span>
																	<span className="hidden xl:inline-block">
																		{'- ' + m.classType}
																	</span>
																</div>
																<div>{m.title}</div>
																<div>{formatTime(m.time)}</div>
																<Button
																	isIconOnly
																	onPress={() => handleShowClassModal(m)}
																	className="absolute right-1 bottom-1 bg-transparent hover:bg-black/10"
																	size="sm"
																>
																	<FaPlus className="size-2.5" />
																</Button>
															</div>
														);
													},
												)
											)}
										</div>
									</div>
								))}
						</div>
					</div>
				</div>
				{showClassModal && selectedClassInfo && (
					<div
						className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40"
						onClick={() => setShowClassModal(false)}
					>
						<div
							className="dark:bg-content1 w-full max-w-2xl rounded-2xl bg-white p-4 shadow-2xl"
							onClick={(e) => e.stopPropagation()}
						>
							<ClassInfoModal
								meeting={selectedClassInfo}
								modalOpen={showClassModal}
								setModalOpen={setShowClassModal}
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
