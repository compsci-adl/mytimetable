import { Divider } from '@nextui-org/react';
import { useState } from 'react';
import {
	FaDiscord,
	FaEnvelope,
	FaFacebook,
	FaGithub,
	FaInstagram,
	FaLinkedin,
} from 'react-icons/fa';

import FooterModal from './FooterModal';

const FOOTER_SECTIONS = [
	{
		title: 'About',
		content:
			'MyTimetable, created by the CS Club Open Source Team, is a drag-and-drop timetable planner designed for University of Adelaide students. It allows students to easily organise, customise, and visualise their class timetables, helping them avoid clashes and optimise their weekly schedules.',
	},
	{
		title: 'Disclaimer',
		content:
			'MyTimetable is NOT an official University of Adelaide website. While we strive to provide accurate and up-to-date information, please be aware that the data may not always reflect the latest changes or updates.',
	},
	{
		title: 'Privacy',
		content:
			'MyTimetable collects anonymous analytics data to help improve user experience and enhance the functionality of the website. We may share collective data with relevant third parties to provide insights into user engagement and improve our services. We are committed to protecting your privacy and will not share any personally identifiable information.',
	},
];

const LINKS = [
	{ icon: FaEnvelope, link: 'mailto:dev@csclub.org.au' },
	{ icon: FaGithub, link: 'https://github.com/compsci-adl/mytimetable' },
	{ icon: FaInstagram, link: 'https://www.instagram.com/csclub.adl/' },
	{ icon: FaFacebook, link: 'https://www.facebook.com/compsci.adl/' },
	{ icon: FaDiscord, link: 'https://discord.gg/UjvVxHA' },
	{ icon: FaLinkedin, link: 'https://www.linkedin.com/company/compsci-adl/' },
];

export const Footer = () => {
	const [openModal, setOpenModal] = useState<string | null>(null);

	const handleOpenModal = (sectionTitle: string) => {
		setOpenModal(sectionTitle);
	};

	const handleCloseModal = () => {
		setOpenModal(null);
	};

	return (
		<footer className="text-xs text-apple-gray-700">
			<Divider className="my-4" />
			<div className="md:flex-rows mb-4 flex flex-col items-center justify-between">
				<div className="flex items-center">
					<img src="/favicon.svg" alt="Logo" className="mr-2 w-10" />
					<h1 className="ml-1 text-xl font-bold text-foreground">
						MyTimetable
					</h1>
				</div>

				<div className="mt-4 flex gap-6 md:mt-0">
					{FOOTER_SECTIONS.map((section, i) => (
						<h3
							key={i}
							className="cursor-pointer text-sm font-semibold uppercase tracking-wider"
							onClick={() => handleOpenModal(section.title)}
						>
							{section.title}
						</h3>
					))}
				</div>
			</div>

			<div className="mb-6 flex flex-col items-center justify-between text-center md:mb-4 md:flex-row">
				<div className="mb-4 flex items-center md:mb-0">
					<span className="mr-1">&copy; {new Date().getFullYear()}</span>
					<a
						href="https://csclub.org.au/"
						target="_blank"
						rel="noopener"
						className="underline"
					>
						The University of Adelaide Computer Science Club
					</a>
				</div>

				<div className="flex justify-center gap-5 text-2xl">
					{LINKS.map(({ icon: Icon, link }, i) => (
						<a
							href={link}
							key={i}
							className="transition-colors duration-300 hover:text-primary"
							target="_blank"
							rel="noopener"
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
					onClose={handleCloseModal}
				/>
			))}
		</footer>
	);
};
