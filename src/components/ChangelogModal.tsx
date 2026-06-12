import { Card, Drawer, Modal, CloseButton } from '@heroui/react';
import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	FaCalendarAlt,
	FaCheckCircle,
	FaExchangeAlt,
	FaPlusCircle,
	FaTrashAlt,
	FaHistory,
} from 'react-icons/fa';

import changelogRaw from '../../CHANGELOG.md?raw';
import { useChangelogModal } from '../helpers/changelog-modal';
import { parseChangelog, isValidChangelogUrl } from '../utils/changelog';

const renderItemText = (text: string) => {
	const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
	const parts = [];
	let lastIndex = 0;
	let match;
	while ((match = regex.exec(text)) !== null) {
		if (match.index > lastIndex) {
			parts.push(text.substring(lastIndex, match.index));
		}
		const linkText = match[1];
		const url = match[2];
		if (isValidChangelogUrl(url)) {
			parts.push(
				<a
					href={url}
					target="_blank"
					rel="noopener noreferrer"
					className="text-primary font-semibold hover:underline"
					key={match.index}
				>
					{linkText}
				</a>,
			);
		} else {
			parts.push(`${linkText} (${url})`);
		}
		lastIndex = regex.lastIndex;
	}
	if (lastIndex < text.length) {
		parts.push(text.substring(lastIndex));
	}
	return parts.length > 0 ? parts : text;
};

export const ChangelogModal = () => {
	const { t } = useTranslation();
	const changelogModal = useChangelogModal();

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

	const sections = useMemo(() => {
		try {
			return parseChangelog(changelogRaw);
		} catch {
			return [];
		}
	}, []);

	const handleClose = () => {
		changelogModal.close();
	};

	const getSectionHeaderStyle = (title: string) => {
		const normTitle = title.toLowerCase();
		if (normTitle === 'added') {
			return {
				bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
				text: 'text-emerald-600 dark:text-emerald-400',
				border: 'border-emerald-500/20 dark:border-emerald-500/30',
				icon: <FaPlusCircle className="mr-1.5 text-xs" />,
			};
		}
		if (normTitle === 'fixed') {
			return {
				bg: 'bg-amber-500/10 dark:bg-amber-500/20',
				text: 'text-amber-600 dark:text-amber-400',
				border: 'border-amber-500/20 dark:border-amber-500/30',
				icon: <FaCheckCircle className="mr-1.5 text-xs" />,
			};
		}
		if (normTitle === 'removed') {
			return {
				bg: 'bg-rose-500/10 dark:bg-rose-500/20',
				text: 'text-rose-600 dark:text-rose-400',
				border: 'border-rose-500/20 dark:border-rose-500/30',
				icon: <FaTrashAlt className="mr-1.5 text-xs" />,
			};
		}
		// Changed or anything else
		return {
			bg: 'bg-blue-500/10 dark:bg-blue-500/20',
			text: 'text-blue-600 dark:text-blue-400',
			border: 'border-blue-500/20 dark:border-blue-500/30',
			icon: <FaExchangeAlt className="mr-1.5 text-xs" />,
		};
	};

	const renderTimelineBody = () => (
		<div className="border-default-200/50 relative ml-3 space-y-8 border-l-2 pl-6">
			{sections.map((section, idx) => {
				const isMajorRelease =
					section.version === '0.1.0' ||
					section.version === '1.0.0' ||
					section.version === '2.0.0' ||
					section.version === '3.0.0';

				return (
					<div key={section.version} className="group relative">
						{/* Timeline Node dot */}
						<div
							className={clsx(
								'absolute top-1.5 flex items-center justify-center rounded-full border shadow-none transition-none',
								isMajorRelease
									? 'border-primary -left-[33px] h-5 w-5 border-2'
									: 'border-default-400 -left-[31px] h-4 w-4',
								idx === 0
									? 'bg-primary border-primary shadow-none'
									: 'bg-background shadow-none',
							)}
						/>

						<div className="flex flex-col gap-3">
							{/* Version & Date Header */}
							<div className="flex flex-wrap items-center gap-2">
								<span
									className={clsx(
										'rounded-full px-2.5 py-0.5 text-sm font-bold tracking-tight shadow-sm transition-transform duration-300 hover:scale-105',
										idx === 0
											? 'bg-primary text-primary-foreground'
											: isMajorRelease
												? 'bg-primary/20 text-primary border-primary/30 dark:bg-primary/30 border'
												: 'bg-default-100 text-foreground',
									)}
								>
									v{section.version}
								</span>
								{section.date && (
									<span className="text-default-400 flex items-center gap-1 text-xs font-semibold">
										<FaCalendarAlt className="text-[10px]" />
										{section.date}
									</span>
								)}
								{idx === 0 && (
									<span className="bg-primary/10 text-primary border-primary/20 py-0.2 rounded-full border px-2 text-[10px] font-black tracking-wider uppercase">
										{t('changelog.latest', 'Latest')}
									</span>
								)}
								{isMajorRelease && idx !== 0 && (
									<span className="bg-primary/10 text-primary border-primary/20 py-0.2 rounded-full border px-2 text-[10px] font-black tracking-wider uppercase">
										{t('changelog.major', 'Major')}
									</span>
								)}
							</div>

							{/* Categories list */}
							<Card
								className={clsx(
									'rounded-2xl border p-4 shadow-sm transition-all duration-300',
									isMajorRelease
										? 'border-primary/40 border-l-primary bg-primary/5 dark:bg-primary/10 shadow-primary/5 hover:bg-primary/10 dark:hover:bg-primary/15 border-l-4 shadow-md'
										: 'border-separator bg-content1/30 hover:bg-content1/50',
								)}
							>
								<Card.Content className="space-y-4">
									{section.subsections.map((sub) => {
										const styles = getSectionHeaderStyle(sub.title);
										return (
											<div key={sub.title} className="space-y-2">
												<span
													className={clsx(
														'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-black tracking-wider uppercase',
														styles.bg,
														styles.text,
														styles.border,
													)}
												>
													{styles.icon}
													{t(
														`changelog.types.${sub.title.toLowerCase()}`,
														sub.title,
													)}
												</span>
												<ul className="space-y-1.5 pl-1.5">
													{sub.items.map((item, itemIdx) => (
														<li
															key={itemIdx}
															className="text-foreground/80 hover:text-foreground flex items-start gap-1.5 text-xs leading-relaxed transition-colors duration-150"
															style={{
																paddingLeft: `${item.indent * 1.25}rem`,
															}}
														>
															<span
																className={clsx(
																	'mt-1 text-[8px] font-bold select-none',
																	item.indent > 0
																		? 'text-default-400'
																		: 'text-primary',
																)}
															>
																{item.indent % 2 === 1 ? '○' : '•'}
															</span>
															<span>{renderItemText(item.text)}</span>
														</li>
													))}
												</ul>
											</div>
										);
									})}
								</Card.Content>
							</Card>
						</div>
					</div>
				);
			})}
		</div>
	);

	if (isMobile) {
		return (
			<Drawer>
				<Drawer.Backdrop
					isOpen={changelogModal.isOpen}
					onOpenChange={(open) => !open && handleClose()}
					variant="opaque"
					className="z-100"
				>
					<Drawer.Content placement="bottom">
						<Drawer.Dialog className="bg-background border-separator max-h-[85vh] overflow-y-auto rounded-t-3xl border-t p-6 pb-12 shadow-2xl">
							<Drawer.Handle />
							<Drawer.Header className="border-separator/50 relative flex flex-col gap-1 border-b pb-2">
								<Drawer.Heading className="text-foreground flex items-center gap-2 text-xl font-bold">
									<FaHistory className="text-primary text-sm" />
									<span>{t('header.changelog')}</span>
								</Drawer.Heading>
								<p className="text-default-500 text-xs font-medium tracking-wide">
									{t(
										'changelog.subtitle',
										'Recent updates and version history',
									)}
								</p>
								<CloseButton
									aria-label="Close"
									onPress={handleClose}
									className="hover:bg-default-100 text-foreground/75 absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full transition-colors focus:outline-none"
								/>
							</Drawer.Header>
							<Drawer.Body className="max-h-[60vh] overflow-y-auto py-4 pr-1">
								{renderTimelineBody()}
							</Drawer.Body>
						</Drawer.Dialog>
					</Drawer.Content>
				</Drawer.Backdrop>
			</Drawer>
		);
	}

	return (
		<Modal.Backdrop
			variant="opaque"
			isOpen={changelogModal.isOpen}
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
							<div className="flex flex-col gap-1">
								<Modal.Heading className="text-foreground flex items-center gap-2 text-xl font-bold">
									<FaHistory className="text-primary text-sm" />
									<span>{t('header.changelog')}</span>
								</Modal.Heading>
								<p className="text-default-500 text-xs font-medium tracking-wide">
									{t(
										'changelog.subtitle',
										'Recent updates and version history',
									)}
								</p>
							</div>
						</Modal.Header>
					</header>
					<Modal.Body className="max-h-[60vh] overflow-y-auto py-4 pr-1">
						{renderTimelineBody()}
					</Modal.Body>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
};
