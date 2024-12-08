import {
	Button,
	Card,
	CardBody,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	Tab,
	Tabs,
} from '@nextui-org/react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
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
			image: {
				path: '/help/access-adelaide.webp',
				alt: 'Access Adelaide enrolment',
			},
		},
	];

	useMount(() => {
		const imagePaths = STEPS.map((step) => step.image.path);
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
	const slideVariants = {
		enter: (direction: boolean) => ({
			x: direction ? '100%' : '-100%',
		}),
		center: { x: 0 },
		exit: (direction: boolean) => ({
			x: direction ? '-100%' : '100%',
		}),
	};

	useEffect(() => {
		if (!helpModal.isOpen) {
			setStepIndex(0);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [helpModal.isOpen]);

	const step = STEPS[stepIndex];

	return (
		<Modal
			size="3xl"
			isOpen={helpModal.isOpen}
			onClose={helpModal.close}
			scrollBehavior="inside"
		>
			<ModalContent>
				<ModalHeader>{t('help.title')}</ModalHeader>
				<ModalBody>
					{/* FIXME: Tabs are missing animation when controlled */}
					<Tabs
						aria-label="Help Steps"
						selectedKey={stepIndexKey}
						onSelectionChange={(step) => setStepIndex(Number(step))}
						className="self-center"
						variant="underlined"
					>
						{STEPS.map((_, i) => (
							<Tab key={i} title={i + 1} />
						))}
					</Tabs>
					<div className="relative h-[38rem] w-full overflow-x-hidden">
						<AnimatePresence initial={false} custom={direction}>
							<motion.div
								key={stepIndexKey}
								custom={direction}
								variants={slideVariants}
								initial="enter"
								animate="center"
								exit="exit"
								transition={{ ease: 'easeInOut', duration: 0.3 }}
								className="absolute h-full w-full p-4 mobile:p-1"
							>
								<Card className="h-full p-2 mobile:p-1">
									<CardBody className="gap-2">
										<div className="text-lg mobile:text-sm">{step.content}</div>
										<div className="flex grow items-center justify-center">
											<img
												alt={step.image.alt}
												src={step.image.path}
												className="max-h-[28rem]"
											/>
										</div>
									</CardBody>
								</Card>
							</motion.div>
						</AnimatePresence>
					</div>
				</ModalBody>
				<ModalFooter className="justify-between">
					<Button
						color="primary"
						onClick={() => setStepIndex(stepIndex - 1)}
						className={clsx('invisible', stepIndex > 0 && 'visible')}
					>
						{t('help.actions.previous-step')}
					</Button>
					{stepIndex < STEPS.length - 1 ? (
						<Button
							className="self-end"
							color="primary"
							onClick={() => setStepIndex(stepIndex + 1)}
						>
							{t('help.actions.next-step')}
						</Button>
					) : (
						<Button color="primary" onClick={helpModal.close}>
							{t('help.actions.get-started')}
						</Button>
					)}
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
};
