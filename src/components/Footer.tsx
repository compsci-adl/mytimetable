import { Modal, Separator } from '@heroui/react';
import { useState } from 'react';
import {
	FaDiscord,
	FaEnvelope,
	FaFacebook,
	FaGithub,
	FaInstagram,
	FaLinkedin,
	FaTiktok,
	FaYoutube,
} from 'react-icons/fa';

import { useWelcomeScreen } from '../helpers/welcome-screen';
import { Tips } from './Tips';

interface FooterModalProps {
	title: string;
	content: string;
	isOpen: boolean;
	onClose: () => void;
}

const FooterModal = ({ title, content, isOpen, onClose }: FooterModalProps) => {
	return (
		<Modal.Backdrop
			variant="opaque"
			isOpen={isOpen}
			onOpenChange={(open) => !open && onClose()}
		>
			<Modal.Container size="md">
				<Modal.Dialog className="bg-background border-separator rounded-3xl border p-6 shadow-2xl">
					<Modal.CloseTrigger className="hover:bg-default-100 rounded-full" />
					<header className="contents">
						<Modal.Header className="border-separator/50 flex w-full flex-col gap-1 border-b pb-2">
							<Modal.Heading className="text-xl font-bold">
								{title}
							</Modal.Heading>
						</Modal.Header>
					</header>
					<Modal.Body className="mt-4">
						<p className="text-foreground/80 mb-4">{content}</p>
					</Modal.Body>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
};

const FOOTER_SECTIONS = [
	{
		title: 'About',
		content:
			'MyTimetable, created by the CS Club Open Source Team, is a drag-and-drop timetable planner designed for Adelaide University students. It allows students to easily organise, customise, and visualise their class timetables, helping them avoid clashes and optimise their weekly schedules.',
	},
	{
		title: 'Disclaimer',
		content:
			'MyTimetable is NOT an official Adelaide University website. While we strive to provide accurate and up-to-date information, please be aware that the data may not always reflect the latest changes or updates.',
	},
	{
		title: 'Privacy',
		content:
			'MyTimetable collects anonymous analytics data to help improve user experience and enhance the functionality of the website. This includes, selected courses, site views, view duration, browser, OS, device type, country and referrer. We may share collective data with relevant third parties to provide insights into user engagement and improve our services. We are committed to protecting your privacy and will not share any personally identifiable information.',
	},
];

const LINKS = [
	{ icon: FaEnvelope, link: 'mailto:dev@csclub.org.au' },
	{ icon: FaGithub, link: 'https://github.com/compsci-adl' },
	{ icon: FaInstagram, link: 'https://www.instagram.com/csclub.adl/' },
	{ icon: FaTiktok, link: 'https://www.tiktok.com/@csclub.adl/' },
	{ icon: FaFacebook, link: 'https://www.facebook.com/compsci.adl/' },
	{ icon: FaDiscord, link: 'https://discord.gg/UjvVxHA' },
	{ icon: FaLinkedin, link: 'https://www.linkedin.com/company/compsci-adl/' },
	{ icon: FaYoutube, link: 'https://www.youtube.com/@csclub-adl/' },
];

export const Footer = () => {
	const [openModal, setOpenModal] = useState<string | null>(null);
	const openWelcome = useWelcomeScreen((s) => s.openWelcome);

	return (
		<footer className="text-apple-gray-700 space-y-3">
			<div className="text-center text-sm">
				<Tips />
			</div>
			<Separator />
			<div className="flex flex-col gap-3 py-2">
				{/* Row 1: Logo | Nav links */}
				<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<div className="flex items-center justify-center gap-2 md:justify-start">
						<img
							src="/favicon.svg"
							alt="Logo"
							className="h-8 w-8 md:h-9 md:w-9"
						/>
						<span className="text-foreground text-base font-bold md:text-lg">
							MyTimetable
						</span>
					</div>
					<div className="flex flex-wrap justify-center gap-4 md:gap-6">
						{FOOTER_SECTIONS.map((section, i) => (
							<h3
								key={i}
								className="hover:text-primary cursor-pointer text-xs font-semibold tracking-widest uppercase transition-colors md:text-sm"
								onClick={() => {
									if (section.title === 'About') {
										openWelcome();
									} else {
										setOpenModal(section.title);
									}
								}}
							>
								{section.title}
							</h3>
						))}
					</div>
				</div>

				{/* Row 2: Copyright | Social icons */}
				<div className="border-separator/40 flex flex-col-reverse gap-4 border-t pt-3 md:flex-row md:items-center md:justify-between md:border-0 md:pt-0">
					<div className="text-foreground/70 flex flex-wrap items-center justify-center gap-1 text-center text-xs md:justify-start md:text-left md:text-sm">
						<span>&copy; {new Date().getFullYear()}</span>
						<a
							href="https://csclub.org.au/"
							target="_blank"
							rel="noopener noreferrer"
							className="hover:text-primary underline transition-colors"
						>
							Adelaide University Computer Science Club
						</a>
					</div>
					<div className="flex items-center justify-center gap-2">
						{LINKS.map(({ icon: Icon, link }, i) => (
							<a
								href={link}
								key={i}
								className="bg-default-100 hover:bg-default-200 text-foreground flex h-8 w-8 items-center justify-center rounded-full text-lg transition-all duration-300 hover:scale-110"
								target="_blank"
								rel="noopener noreferrer"
							>
								<Icon />
							</a>
						))}
					</div>
				</div>
			</div>

			{FOOTER_SECTIONS.map((section) => (
				<FooterModal
					key={section.title}
					title={section.title}
					content={section.content}
					isOpen={openModal === section.title}
					onClose={() => setOpenModal(null)}
				/>
			))}
		</footer>
	);
};
