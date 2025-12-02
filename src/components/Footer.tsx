import {
	Divider,
	Modal,
	ModalBody,
	ModalContent,
	ModalHeader,
} from '@heroui/react';
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

import { Tips } from './Tips';

interface FooterModalProps {
	title: string;
	content: string;
	isOpen: boolean;
	onClose: () => void;
}

const FooterModal = ({ title, content, isOpen, onClose }: FooterModalProps) => {
	return (
		<Modal isOpen={isOpen} onClose={onClose}>
			<ModalContent>
				<ModalHeader>{title}</ModalHeader>
				<ModalBody>
					<p className="mb-4">{content}</p>
				</ModalBody>
			</ModalContent>
		</Modal>
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
			'MyTimetable collects anonymous analytics data to help improve user experience and enhance the functionality of the website. We may share collective data with relevant third parties to provide insights into user engagement and improve our services. We are committed to protecting your privacy and will not share any personally identifiable information.',
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

	return (
		<footer className="space-y-4 text-apple-gray-700">
			<div className="text-center text-sm">
				<Tips />
			</div>
			<Divider />
			<div className="grid grid-cols-2 items-center gap-2 mobile:grid-cols-1 mobile:justify-items-center mobile:gap-4">
				<div className="flex items-center gap-2">
					<img src="/favicon.svg" alt="Logo" className="w-10" />
					<h1 className="ml-1 text-xl font-bold text-foreground">
						MyTimetable
					</h1>
				</div>

				<div className="mt-0 flex gap-6 justify-self-end mobile:justify-self-auto">
					{FOOTER_SECTIONS.map((section, i) => (
						<h3
							key={i}
							className="cursor-pointer text-sm font-semibold uppercase tracking-wider transition-colors hover:text-primary"
							onClick={() => setOpenModal(section.title)}
						>
							{section.title}
						</h3>
					))}
				</div>

				<div className="flex items-center text-sm">
					<span className="mr-1">&copy; {new Date().getFullYear()}</span>
					<a
						href="https://csclub.org.au/"
						target="_blank"
						className="underline"
					>
						Adelaide University Computer Science Club
					</a>
				</div>

				<div className="flex gap-5 justify-self-end text-2xl mobile:justify-self-auto">
					{LINKS.map(({ icon: Icon, link }, i) => (
						<a
							href={link}
							key={i}
							className="transition-colors duration-300 hover:text-primary"
							target="_blank"
						>
							<Icon />
						</a>
					))}
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
