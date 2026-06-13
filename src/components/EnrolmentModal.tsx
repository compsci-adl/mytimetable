import { Button, Card, Link, Modal, Separator, Tooltip } from '@heroui/react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import {
	FaCalendarAlt,
	FaClipboard,
	FaExclamationTriangle,
	FaExternalLinkAlt,
} from 'react-icons/fa';

import { useDetailedEnrolledCourses } from '../data/enrolled-courses';
import { findConflicts } from '../helpers/conflicts';
import { useExportCalendar } from '../helpers/export-calendar';

type ReadyModalProps = {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
};
export const EnrolmentModal = ({ isOpen, onOpenChange }: ReadyModalProps) => {
	const { t } = useTranslation();
	const { copyText, exportIcs } = useExportCalendar();

	const enrolledCourses = useDetailedEnrolledCourses();
	const isOnlyCourse = enrolledCourses.length === 1;
	const { conflictsByClassKey } = findConflicts(enrolledCourses);

	return (
		<Modal.Backdrop
			variant="opaque"
			isOpen={isOpen}
			onOpenChange={onOpenChange}
		>
			<Modal.Container size={isOnlyCourse ? 'xs' : 'lg'}>
				<Modal.Dialog className="bg-background border-separator w-full max-w-2xl rounded-3xl border p-6 shadow-2xl">
					<Modal.CloseTrigger className="hover:bg-default-100 rounded-full" />
					<header className="contents">
						<Modal.Header className="border-separator/50 flex w-full flex-col gap-1 border-b pb-2">
							<Modal.Heading className="text-foreground text-xl font-black">
								{t('calendar.end-actions.ready')}
							</Modal.Heading>
							<div className="text-default-500 text-sm font-normal">
								{t('calendar.end-actions.enrolment-instruction')}
							</div>
						</Modal.Header>
					</header>
					<Modal.Body
						className={clsx('mt-4 gap-4', !isOnlyCourse && 'grid grid-cols-2')}
					>
						{enrolledCourses.map((c) => (
							<Card
								key={c.id}
								className="border-separator bg-content1/50 overflow-hidden rounded-2xl border shadow-sm"
							>
								<Card.Header className="flex flex-col p-4 text-center">
									<Card.Title className="text-foreground text-lg font-black">
										{c.name.code}
									</Card.Title>
									<Card.Description className="text-default-500 text-xs">
										{c.name.title}
									</Card.Description>
								</Card.Header>
								<Separator />
								<Card.Content
									className={clsx(
										c.classes.length === 1 ? 'grid-cols-1' : 'grid-cols-2',
										'grid items-center justify-items-center gap-4 p-4',
									)}
								>
									{c.classes.map((cls) => {
										const isFull =
											cls.available_seats !== undefined &&
											parseInt(cls.available_seats, 10) === 0;
										const classKey = `${c.id}|${cls.typeId}|${cls.classNumber}`;
										const classConflicts = conflictsByClassKey[classKey] ?? [];
										return (
											<div
												key={cls.typeId}
												className="border-separator bg-content2/30 min-w-22.5 rounded-xl border p-2.5 text-center"
											>
												<div className="border-separator text-foreground border-b pb-1 text-sm font-bold">
													<span className="flex items-center justify-center gap-1.5">
														{isFull && (
															<Tooltip delay={0}>
																<Tooltip.Trigger>
																	<span
																		tabIndex={0}
																		role="img"
																		aria-label={t(
																			'calendar.no-available-seats',
																			{
																				defaultValue: 'Class full',
																			},
																		)}
																		className="text-danger flex items-center outline-none"
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
														{classConflicts.length > 0 && (
															<Tooltip delay={0}>
																<Tooltip.Trigger>
																	<span
																		tabIndex={0}
																		role="img"
																		aria-label={
																			t('calendar.conflict') ??
																			'Conflicts with another class'
																		}
																		className="text-warning flex items-center outline-none"
																	>
																		<FaExclamationTriangle />
																	</span>
																</Tooltip.Trigger>
																<Tooltip.Content>
																	{t('calendar.conflict') ??
																		'Conflicts with another class'}
																</Tooltip.Content>
															</Tooltip>
														)}
														<span>{cls.type}</span>
													</span>
												</div>
												<div className="text-default-600 mt-1.5 text-xs font-semibold">
													{cls.classNumber}
												</div>
											</div>
										);
									})}
								</Card.Content>
							</Card>
						))}
					</Modal.Body>
					<Modal.Footer className="border-separator mt-4 flex items-center justify-between border-t pt-4">
						<div className="flex items-center gap-2">
							<Tooltip delay={0}>
								<Tooltip.Trigger>
									<Button
										isIconOnly
										className="bg-default-100 hover:bg-default-200 flex h-9 w-9 items-center justify-center rounded-full text-lg"
										onPress={exportIcs}
										variant="secondary"
									>
										<FaCalendarAlt />
									</Button>
								</Tooltip.Trigger>
								<Tooltip.Content>
									{t('calendar.end-actions.export')}
								</Tooltip.Content>
							</Tooltip>
							<Tooltip delay={0}>
								<Tooltip.Trigger>
									<Button
										isIconOnly
										className="bg-default-100 hover:bg-default-200 flex h-9 w-9 items-center justify-center rounded-full text-lg"
										onPress={copyText}
										variant="secondary"
									>
										<FaClipboard />
									</Button>
								</Tooltip.Trigger>
								<Tooltip.Content>
									{t('calendar.end-actions.copy')}
								</Tooltip.Content>
							</Tooltip>
						</div>
						<Link
							href="https://apps.adelaide.edu.au/student/myenrolment/"
							target="_blank"
							rel="noopener noreferrer"
							className="bg-primary text-primary-foreground hover:bg-opacity-90 flex items-center justify-center gap-1.5 rounded-full px-6 py-2 text-sm font-bold transition-colors"
						>
							<span>myEnrolment</span>
							<FaExternalLinkAlt className="text-xs" />
						</Link>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
};
