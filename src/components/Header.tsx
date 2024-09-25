import {
	Button,
	Link,
	Navbar,
	NavbarBrand,
	NavbarContent,
	NavbarItem,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Tooltip,
} from '@nextui-org/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useHelpModal } from '../helpers/help-modal';

const LANGUAGES = [
	{ code: 'en-AU', name: 'English', flag: '🇦🇺' },
	{ code: 'zh-CN', name: '中文', flag: '🇨🇳' },
];
const DEFAULT_LANGUAGE = LANGUAGES[0];

const HEADER_BUTTON_PROPS = {
	size: 'sm',
	isIconOnly: true,
	variant: 'flat',
	color: 'primary',
	className: 'text-xl',
} as const;

export const Header = () => {
	const { t, i18n } = useTranslation();
	const currentLanguage =
		LANGUAGES.find((l) => l.code === i18n.language) ?? DEFAULT_LANGUAGE;

	const openHelpModal = useHelpModal((s) => s.open);

	const [isChangeLanguageOpen, setIsChangeLanguageOpen] = useState(false);

	return (
		<Navbar isBordered maxWidth="xl" position="static">
			<NavbarBrand>
				<h1 className="font-bold text-inherit">My Timetable</h1>
			</NavbarBrand>
			<NavbarContent justify="end">
				<NavbarItem>
					<Tooltip content={t('header.help')} size="sm">
						<Button {...HEADER_BUTTON_PROPS} onClick={openHelpModal}>
							❓
						</Button>
					</Tooltip>
				</NavbarItem>
				<NavbarItem>
					<Tooltip content={t('header.report')} size="sm">
						<Button
							{...HEADER_BUTTON_PROPS}
							as={Link}
							href="mailto:dev@csclub.org.au"
						>
							🐛
						</Button>
					</Tooltip>
				</NavbarItem>
				<NavbarItem>
					<Popover
						isOpen={isChangeLanguageOpen}
						onOpenChange={(open) => setIsChangeLanguageOpen(open)}
					>
						<Tooltip
							content={t('header.change-language')}
							size="sm"
							isDisabled={isChangeLanguageOpen}
						>
							<div>
								<PopoverTrigger>
									<Button {...HEADER_BUTTON_PROPS}>
										{currentLanguage.flag}
									</Button>
								</PopoverTrigger>
							</div>
						</Tooltip>
						<PopoverContent>
							{LANGUAGES.map((language) => (
								<Button
									key={language.code}
									fullWidth
									variant="light"
									onClick={() => i18n.changeLanguage(language.code)}
								>
									{language.name} {language.flag}
								</Button>
							))}
						</PopoverContent>
					</Popover>
				</NavbarItem>
			</NavbarContent>
		</Navbar>
	);
};
