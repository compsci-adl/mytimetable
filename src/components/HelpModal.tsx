import { Button, Card, Modal, Tabs } from '@heroui/react';
import clsx from 'clsx';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

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
						<Modal.Header>
							<Modal.Heading className="text-xl font-bold">
								{t('help.title')}
							</Modal.Heading>
						</Modal.Header>
					</header>
					<Modal.Body className="gap-4">
						<Tabs
							selectedKey={stepIndexKey}
							onSelectionChange={(step) => setStepIndex(Number(step))}
						>
							<Tabs.ListContainer className="self-center">
								<Tabs.List
									aria-label="Help Steps"
									className="border-separator flex border-b"
								>
									{STEPS.map((_, i) => (
										<Tabs.Tab
											key={i}
											id={String(i)}
											className="rounded-t-lg px-4 py-2 text-sm font-semibold"
										>
											{i + 1}
											<Tabs.Indicator className="bg-primary h-0.5" />
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
								<Card className="mobile:p-1 border-separator bg-content1/50 h-full rounded-2xl border p-2 shadow-md">
									<Card.Content className="flex h-full flex-col gap-2">
										<div className="mobile:text-sm text-foreground text-lg font-medium">
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
					</Modal.Body>
					<Modal.Footer className="border-separator flex justify-between border-t pt-4">
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
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
};
