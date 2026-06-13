import type { TFunction } from 'i18next';

export type HelpStep = {
	content: string;
	image?: {
		path: string;
		alt?: string;
	};
};

export const getHelpSteps = (t: TFunction): HelpStep[] => [
	{
		content: t('help.steps.welcome'),
		image: {
			path: '/help/welcome.webp',
			alt: 'Website preview',
		},
	},
	{
		content: t('help.steps.select-term'),
		image: {
			path: '/help/select-term.webp',
			alt: 'Select a term',
		},
	},
	{
		content: t('help.steps.filters'),
		image: {
			path: '/help/filters.webp',
			alt: 'Apply filters',
		},
	},
	{
		content: t('help.steps.search-course'),
		image: {
			path: '/help/search-course.webp',
			alt: 'Search a course',
		},
	},
	{
		content: t('help.steps.calendar-dnd'),
		image: {
			path: '/help/calendar.webp',
			alt: 'Drag and drop a course in calendar',
		},
	},
	{
		content: t('help.steps.change-week'),
		image: {
			path: '/help/change-week.webp',
			alt: 'Change calendar week',
		},
	},
	{
		content: t('help.steps.auto-timetable'),
		image: {
			path: '/help/auto-timetable.webp',
			alt: 'Auto-Timetable button',
		},
	},
	{
		content: t('help.steps.course-details'),
		image: {
			path: '/help/click-course.webp',
			alt: 'Highlighted enrolled course',
		},
	},
	{
		content: t('help.steps.course-modal'),
		image: {
			path: '/help/modal.webp',
			alt: 'Course modal to change class time',
		},
	},
	{
		content: t('help.steps.ready-button'),
		image: {
			path: '/help/ready-button.webp',
			alt: 'Ready button at bottom',
		},
	},
	{
		content: t('help.steps.enrolment'),
		image: {
			path: '/help/enrolment.webp',
			alt: 'Enrolment process',
		},
	},
];
