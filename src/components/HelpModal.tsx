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
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

import { useHelpModal } from '../helpers/help-modal';

const STEPS = [
	{
		content: 'Select a term.',
		image: {
			path: '/help/select-term.png',
			alt: 'Select a term',
		},
	},
	{
		content:
			'Search for a course and press “Add” to add the course to the timetable.',
		image: { path: '/help/search-course.png', alt: 'Search a course' },
	},
	{
		content:
			'Scroll down to see the calendar with your enrolled courses. You can drag a class and drop it in one of the highlighted boxes to change its time.',
		image: {
			path: '/help/calendar.png',
			alt: 'Drag and drop a course in calendar',
		},
	},
	{
		content: 'Change the calendar week to see more classes.',
		image: { path: '/help/change-week.png', alt: 'Change calendar week' },
	},
	{
		content:
			'Click your enrolled course to see details of your enrolled classes.',
		image: {
			path: '/help/click-course.png',
			alt: 'Highlighted enrolled course',
		},
	},
	{
		content:
			'If you encounter any lesson clashes when using MyTimetable, you can open the modal to change the lesson.',
		image: {
			path: '/help/modal.png',
			alt: 'Course modal to change lesson time',
		},
	},
	{
		content:
			'You can enrol for courses in Access Adelaide by using the class numbers, once you are happy with your class times.',
		image: {
			path: '/help/access-adelaide.png',
			alt: 'Access Adelaide enrolment',
		},
	},
];
export const HelpModal = () => {
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

	const step = STEPS[stepIndex];

	return (
		<Modal
			size="3xl"
			isOpen={helpModal.isOpen}
			onClose={helpModal.close}
			scrollBehavior="inside"
		>
			<ModalContent>
				<ModalHeader>How to use MyTimetable</ModalHeader>
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
								className="absolute h-full w-full p-4"
							>
								<Card className="h-full p-2">
									<CardBody>
										<p className="text-lg">{step.content}</p>
										<div className="flex h-full flex-col justify-center">
											<img
												alt={step.image.alt}
												src={step.image.path}
												className="max-h-[28rem] object-contain"
											/>
										</div>
									</CardBody>
								</Card>
							</motion.div>
						</AnimatePresence>
					</div>
				</ModalBody>
				<ModalFooter>
					{stepIndex < STEPS.length - 1 ? (
						<Button color="primary" onClick={() => setStepIndex(stepIndex + 1)}>
							Next Step
						</Button>
					) : (
						<Button color="primary" onClick={helpModal.close}>
							Get Started!
						</Button>
					)}
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
};
