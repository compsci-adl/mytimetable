import { Button, Card, Drawer, Modal, Tabs } from '@heroui/react';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaQuestionCircle } from 'react-icons/fa';

import { useHelpModal } from '../helpers/help-modal';
import { useMount } from '../utils/mount';
import { prefetchImages } from '../utils/prefetch-image';

export const HelpModal = () => {
	const { t } = useTranslation();

	const STEPS = [
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
			content: t('help.steps.search-course'),
			image: { path: '/help/search-course.webp', alt: 'Search a course' },
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
			image: { path: '/help/change-week.webp', alt: 'Change calendar week' },
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
			content: t('help.steps.access-adelaide'),
		},
	];

	useMount(() => {
		const imagePaths = STEPS.map((step) => step.image?.path).filter(
			(p): p is string => Boolean(p),
		);
		prefetchImages(imagePaths);
	});

	const helpModal = useHelpModal();

	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const media = window.matchMedia('(max-width: 767px)');
		const isCurrentlyMobile = media.matches;
		const id = setTimeout(() => {
			setIsMobile(isCurrentlyMobile);
		}, 0);
		const listener = (e: MediaQueryListEvent) => setIsMobile(e.matches);
		media.addEventListener('change', listener);
		return () => {
			clearTimeout(id);
			media.removeEventListener('change', listener);
		};
	}, []);

	const [direction, setDirection] = useState(true);
	const [stepIndexKey, setStepIndexKey] = useState('0');
	const stepIndex = Number(stepIndexKey);
	const setStepIndex = (index: number) => {
		setDirection(index >= stepIndex);
		setStepIndexKey(String(index));
	};

	const handleClose = () => {
		setStepIndex(0);
		helpModal.close();
	};

	const step = STEPS[stepIndex];

	const renderHelpBody = () => (
		<div className="flex flex-col gap-4">
			<Tabs
				selectedKey={stepIndexKey}
				onSelectionChange={(step) => setStepIndex(Number(step))}
			>
				<Tabs.ListContainer className="self-center">
					<Tabs.List
						aria-label="Help Steps"
						className="bg-content2 border-separator flex max-w-full gap-1 overflow-x-auto rounded-full border p-1"
					>
						{STEPS.map((_, i) => (
							<Tabs.Tab
								key={i}
								id={String(i)}
								className={clsx(
									'relative rounded-full px-3 py-1 text-xs font-semibold transition-colors',
									stepIndex === i
										? 'text-primary-foreground font-black'
										: 'text-default-500 hover:text-foreground',
								)}
							>
								{i + 1}
								<Tabs.Indicator className="bg-primary rounded-full" />
							</Tabs.Tab>
						))}
					</Tabs.List>
				</Tabs.ListContainer>
			</Tabs>
			<div className="relative h-120 w-full overflow-hidden">
				<div
					key={stepIndexKey}
					className={clsx(
						'mobile:p-1 absolute h-full w-full p-4',
						direction ? 'animate-slide-right' : 'animate-slide-left',
					)}
				>
					<Card className="mobile:p-3 border-separator bg-content1/50 h-full rounded-3xl border p-4 shadow-md md:p-6">
						<Card.Content className="flex h-full flex-col gap-4 md:gap-6">
							<div className="mobile:text-sm text-foreground px-2 text-center text-base leading-relaxed md:px-4 md:text-lg">
								{step.content}
							</div>
							<div className="flex grow items-center justify-center overflow-hidden">
								{step.image?.path ? (
									<img
										alt={step.image?.alt ?? step.content}
										src={step.image.path}
										className="border-separator max-h-80 rounded-xl border object-contain shadow-sm"
									/>
								) : null}
							</div>
						</Card.Content>
					</Card>
				</div>
			</div>
		</div>
	);

	const renderHelpFooter = () => (
		<div className="border-separator flex justify-between border-t pt-4">
			<Button
				variant="secondary"
				onPress={() => setStepIndex(stepIndex - 1)}
				className={clsx(
					'invisible rounded-full px-6',
					stepIndex > 0 && 'visible',
				)}
			>
				{t('help.actions.previous-step')}
			</Button>
			{stepIndex < STEPS.length - 1 ? (
				<Button
					className="rounded-full px-6"
					variant="primary"
					onPress={() => setStepIndex(stepIndex + 1)}
				>
					{t('help.actions.next-step')}
				</Button>
			) : (
				<Button
					variant="primary"
					className="rounded-full px-6"
					onPress={handleClose}
				>
					{t('help.actions.get-started')}
				</Button>
			)}
		</div>
	);

	if (isMobile) {
		return (
			<Drawer>
				<Drawer.Backdrop
					isOpen={helpModal.isOpen}
					onOpenChange={(open) => !open && handleClose()}
					variant="opaque"
					className="z-100"
				>
					<Drawer.Content placement="bottom">
						<Drawer.Dialog className="bg-background border-separator max-h-[92vh] overflow-y-auto rounded-t-3xl border-t p-6 pb-12 shadow-2xl">
							<Drawer.Handle />
							<Drawer.Header className="border-separator/50 relative flex flex-col gap-1 border-b pb-2">
								<Drawer.Heading className="text-foreground flex items-center gap-2 text-xl font-bold">
									<FaQuestionCircle className="text-primary text-sm" />
									<span>{t('help.title')}</span>
								</Drawer.Heading>
								<button
									onClick={handleClose}
									className="hover:bg-default-100 text-foreground/75 absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full transition-colors focus:outline-none"
									aria-label="Close"
								>
									<span className="text-xl">×</span>
								</button>
							</Drawer.Header>
							<Drawer.Body className="pt-2">{renderHelpBody()}</Drawer.Body>
							{renderHelpFooter()}
						</Drawer.Dialog>
					</Drawer.Content>
				</Drawer.Backdrop>
			</Drawer>
		);
	}

	return (
		<Modal.Backdrop
			variant="opaque"
			isOpen={helpModal.isOpen}
			onOpenChange={(open) => !open && handleClose()}
		>
			<Modal.Container size="lg">
				<Modal.Dialog className="bg-background border-separator w-full max-w-3xl rounded-3xl border p-6 shadow-2xl">
					<Modal.CloseTrigger
						onPress={handleClose}
						className="hover:bg-default-100 rounded-full"
					/>
					<header className="contents">
						<Modal.Header className="border-separator/50 w-full border-b pb-2">
							<Modal.Heading className="text-foreground flex items-center gap-2 text-xl font-bold">
								<FaQuestionCircle className="text-primary text-sm" />
								<span>{t('help.title')}</span>
							</Modal.Heading>
						</Modal.Header>
					</header>
					<Modal.Body className="gap-4">{renderHelpBody()}</Modal.Body>
					<Modal.Footer>{renderHelpFooter()}</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
};
