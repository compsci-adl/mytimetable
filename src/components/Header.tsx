import { Button, Link, Popover, Tooltip } from '@heroui/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	FaCommentDots,
	FaGlobe,
	FaMoon,
	FaQuestionCircle,
	FaSun,
	FaHistory,
} from 'react-icons/fa';

import { LANGUAGES } from '../constants/languages';
import { useChangelogModal } from '../helpers/changelog-modal';
import { useDarkMode } from '../helpers/dark-mode';
import { useHelpModal } from '../helpers/help-modal';

const HEADER_BUTTON_PROPS = {
	size: 'sm',
	isIconOnly: true,
	variant: 'secondary',
	className:
		'text-lg rounded-full flex items-center justify-center bg-default-100 hover:bg-default-200 text-foreground',
} as const;

export const Header = ({ isWelcome = false }: { isWelcome?: boolean }) => {
	const { t, i18n } = useTranslation();

	const openHelpModal = useHelpModal((s) => s.open);
	const openChangelogModal = useChangelogModal((s) => s.open);

	const [isChangeLanguageOpen, setIsChangeLanguageOpen] = useState(false);

	const { isDarkMode, toggleIsDarkMode } = useDarkMode();

	return (
		<nav
			className={`flex h-16 w-full items-center ${
				isWelcome
					? 'sticky top-0 z-50 bg-transparent'
					: 'border-separator bg-background border-b'
			}`}
		>
			<div
				className={`flex w-full items-center justify-between ${
					isWelcome ? 'pl-4 md:pl-6' : 'mx-auto max-w-(--breakpoint-xl) px-2'
				}`}
			>
				<div className="flex items-center">
					<img src="/favicon.svg" alt="Logo" className="mr-2 h-6 w-6" />
					<h1 className="text-foreground text-lg font-bold">MyTimetable</h1>
				</div>
				{!isWelcome && (
					<div className="flex items-center gap-2">
						<div>
							<Tooltip delay={0}>
								<Tooltip.Trigger>
									<Button {...HEADER_BUTTON_PROPS} onPress={openHelpModal}>
										<FaQuestionCircle />
									</Button>
								</Tooltip.Trigger>
								<Tooltip.Content>{t('header.help')}</Tooltip.Content>
							</Tooltip>
						</div>
						<div>
							<Tooltip delay={0}>
								<Tooltip.Trigger>
									<Button {...HEADER_BUTTON_PROPS} onPress={openChangelogModal}>
										<FaHistory />
									</Button>
								</Tooltip.Trigger>
								<Tooltip.Content>{t('header.changelog')}</Tooltip.Content>
							</Tooltip>
						</div>
						<div>
							<Tooltip delay={0}>
								<Tooltip.Trigger>
									<Link
										href={import.meta.env.VITE_FEEDBACK_FORM_URL}
										target="_blank"
										rel="noopener noreferrer"
										className="bg-default-100 hover:bg-default-200 text-foreground flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-lg"
									>
										<FaCommentDots />
									</Link>
								</Tooltip.Trigger>
								<Tooltip.Content>{t('header.feedback')}</Tooltip.Content>
							</Tooltip>
						</div>
						<div>
							<Tooltip delay={0}>
								<Tooltip.Trigger>
									<Button {...HEADER_BUTTON_PROPS} onPress={toggleIsDarkMode}>
										{isDarkMode ? <FaMoon /> : <FaSun />}
									</Button>
								</Tooltip.Trigger>
								<Tooltip.Content>
									{t('header.toggle-dark-mode')}
								</Tooltip.Content>
							</Tooltip>
						</div>
						<div>
							<Popover
								isOpen={isChangeLanguageOpen}
								onOpenChange={(open) => setIsChangeLanguageOpen(open)}
							>
								<Tooltip delay={0} isDisabled={isChangeLanguageOpen}>
									<Tooltip.Trigger>
										<Popover.Trigger>
											<Button {...HEADER_BUTTON_PROPS}>
												<FaGlobe />
											</Button>
										</Popover.Trigger>
									</Tooltip.Trigger>
									<Tooltip.Content>
										{t('header.change-language')}
									</Tooltip.Content>
								</Tooltip>
								<Popover.Content>
									<Popover.Dialog className="bg-overlay border-separator flex min-w-[150px] flex-col gap-1 rounded-2xl border p-2 shadow-xl">
										{LANGUAGES.map((language) => (
											<Button
												key={language.code}
												fullWidth
												variant="tertiary"
												onPress={() => {
													i18n.changeLanguage(language.code);
													setIsChangeLanguageOpen(false);
												}}
												className="hover:bg-default-100 text-foreground justify-start gap-2 rounded-xl px-3 py-2 text-sm"
											>
												<span>{language.name} </span>
												<span className="font-noto-emoji">{language.flag}</span>
											</Button>
										))}
									</Popover.Dialog>
								</Popover.Content>
							</Popover>
						</div>
					</div>
				)}
			</div>
		</nav>
	);
};
