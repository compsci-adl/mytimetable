import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useDetailedEnrolledCourses } from '../data/enrolled-courses';
import type dayjs from '../lib/dayjs';
import { dateToDayjs, timeToDayjs } from '../utils/date';

export const useExportCalendar = () => {
	const { t } = useTranslation();

	const enrolledCourses = useDetailedEnrolledCourses();
	const copyText = async () => {
		const res = enrolledCourses.map((c) => ({
			name: c.name.title + '\n' + c.name.subject + ' ' + c.name.code,
			classes: c.classes
				.map(({ type, classNumber }) => type + ': ' + classNumber)
				.join('\n'),
		}));
		const resStr = res.map((d) => d.name + '\n\n' + d.classes).join('\n\n');
		const advertisement =
			'Planned with MyTimetable\nhttps://mytimetable.csclub.org.au/';
		await navigator.clipboard.writeText(resStr + '\n\n\n' + advertisement);
		toast.success(t('calendar.end-actions.copy-success'));
	};

	const formatForIcs = (d: dayjs.Dayjs) => d.format('YYYYMMDDTHHmm00');

	const escapeIcs = (s: string) =>
		s
			.replace(/\\/g, '\\\\')
			.replace(/\n/g, '\\n')
			.replace(/,/g, '\\,')
			.replace(/;/g, '\\;');

	const weekdayMap: Record<string, string> = {
		Monday: 'MO',
		Tuesday: 'TU',
		Wednesday: 'WE',
		Thursday: 'TH',
		Friday: 'FR',
		Saturday: 'SA',
		Sunday: 'SU',
	};

	const exportIcs = async () => {
		if (!enrolledCourses || enrolledCourses.length === 0) {
			toast.error(t('calendar.end-actions.no-courses'));
			return;
		}

		const events: string[] = [];

		enrolledCourses.forEach((c) => {
			c.classes.forEach((cls) => {
				cls.meetings.forEach((m) => {
					// Build DTSTART/DTEND from date + time using YEAR in utils
					const startDate = dateToDayjs(m.date.start);
					const endDate = dateToDayjs(m.date.end);
					// Find the first date that matches the weekday on/after startDate
					let first = startDate;
					const meetingWeekday = m.day;
					const desiredIso = (
						{
							Monday: 1,
							Tuesday: 2,
							Wednesday: 3,
							Thursday: 4,
							Friday: 5,
							Saturday: 6,
							Sunday: 7,
						} as Record<string, number>
					)[meetingWeekday as string];
					if (desiredIso) {
						first = first.isoWeekday(desiredIso);
						if (first.isBefore(startDate)) first = first.add(1, 'week');
					}
					const startTime = timeToDayjs(m.time.start);
					const endTime = timeToDayjs(m.time.end);
					const dtStart = first
						.hour(startTime.hour())
						.minute(startTime.minute());
					const dtEnd = first.hour(endTime.hour()).minute(endTime.minute());

					const uid = `mytimetable-${c.id}-${cls.typeId}-${m.day}-${m.time.start}-${m.time.end}-${Math.random().toString(36).slice(2, 9)}`;

					const byday = weekdayMap[m.day] ?? 'MO';
					const until = endDate.endOf('day').format('YYYYMMDDT235959');

					// Summary should be "CODE Title" (eg. "COMP1002 Problem Solving and Programming")
					const summary = `${c.name.code} ${c.name.title}`;
					// Short description should be just the class type (eg. "Tutorial")
					const shortType = cls.type.includes(':')
						? cls.type.split(':').pop()!.trim()
						: cls.type;
					const description = `${shortType}`;
					// Include location with campus
					const locationStr = m.location
						? `${m.location}, ${m.campus ?? ''}`
						: `${m.campus ?? ''}`;

					const summaryEsc = escapeIcs(summary);
					const descriptionEsc = escapeIcs(description);
					const locationEsc = escapeIcs(locationStr);

					const event = [
						'BEGIN:VEVENT',
						`UID:${uid}`,
						`SUMMARY:${summaryEsc}`,
						`DESCRIPTION:${descriptionEsc}`,
						`LOCATION:${locationEsc}`,
						`DTSTART:${formatForIcs(dtStart)}`,
						`DTEND:${formatForIcs(dtEnd)}`,
						`RRULE:FREQ=WEEKLY;BYDAY=${byday};UNTIL=${until}`,
						'END:VEVENT',
					].join('\r\n');
					events.push(event);
				});
			});
		});

		const ics = [
			'BEGIN:VCALENDAR',
			'VERSION:2.0',
			'PRODID:-//MyTimetable//EN',
			...events,
			'END:VCALENDAR',
		].join('\r\n');

		const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'mytimetable.ics';
		document.body.appendChild(a);
		a.click();
		URL.revokeObjectURL(url);
		a.remove();
		toast.success(t('calendar.end-actions.export-success'));
	};
	return { copyText, exportIcs };
};
