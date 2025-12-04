import {
	Button,
	Card,
	CardBody,
	CardHeader,
	Divider,
	Link,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	Tooltip,
} from '@heroui/react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

import { useDetailedEnrolledCourses } from '../data/enrolled-courses';
import { useExportCalendar } from '../helpers/export-calendar';

type ReadyModalProps = {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
};
export const EnrolmentModal = ({ isOpen, onOpenChange }: ReadyModalProps) => {
	const { t } = useTranslation();
	const { copyText } = useExportCalendar();

	const enrolledCourses = useDetailedEnrolledCourses();
	const isOnlyCourse = enrolledCourses.length === 1;

	return (
		<Modal
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			size={isOnlyCourse ? 'xs' : '2xl'}
		>
			<ModalContent>
				<ModalHeader className="flex-col">
					<div>{t('calendar.end-actions.ready')}</div>
					<div className="text-sm font-normal">
						{t('calendar.end-actions.enrolment-instruction')}
					</div>
				</ModalHeader>
				<ModalBody className={clsx(!isOnlyCourse && 'grid grid-cols-2')}>
					{enrolledCourses.map((c) => (
						<Card key={c.id}>
							<CardHeader className="flex-col text-center">
								<p className="text-lg font-black">{c.name.code}</p>
								<p className="text-sm">{c.name.title}</p>
							</CardHeader>
							<Divider />
							<CardBody className="grid grid-cols-2 items-center justify-center gap-2">
								{c.classes.map((cls) => {
									const isFull =
										cls.available_seats !== undefined &&
										parseInt(cls.available_seats, 10) === 0;
									return (
										<div
											key={cls.typeId}
											className="rounded-lg border *:p-1 *:text-center"
										>
											<div className="border-b font-bold">
												<span className="flex items-center justify-center gap-2">
													{isFull && (
														<Tooltip
															content={
																t('calendar.no-available-seats', {
																	defaultValue: 'No available seats',
																}) as string
															}
															size="sm"
														>
															<span aria-hidden className="text-danger">
																⚠️
															</span>
														</Tooltip>
													)}
													<span>{cls.type}</span>
												</span>
											</div>
											<div>{cls.classNumber}</div>
										</div>
									);
								})}
							</CardBody>
						</Card>
					))}
				</ModalBody>
				<ModalFooter className="justify-between">
					<Tooltip content={t('calendar.end-actions.copy')} size="sm">
						<Button
							isIconOnly
							className="text-xl"
							onPress={copyText}
							variant="flat"
						>
							📋
						</Button>
					</Tooltip>
					<Button
						href="https://apps.adelaide.edu.au/student/myenrolment/"
						as={Link}
						showAnchorIcon
						target="_blank"
					>
						myEnrolment
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
};
