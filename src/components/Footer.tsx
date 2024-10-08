import { Divider } from '@nextui-org/react';
import {
	FaDiscord,
	FaEnvelope,
	FaFacebook,
	FaGithub,
	FaInstagram,
	FaLinkedin,
} from 'react-icons/fa';

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
			'MyTimetable collects anonymous analytics data to help improve user experience and enhance the functionality of the website. This data is collected without personally identifying users and is used solely for analytical purposes. We may share collective data with relevant third parties to provide insights into user engagement and improve our services. We are committed to protecting your privacy and will not share any personally identifiable information.',
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
	return (
		<footer className="text-xs text-apple-gray-500">
			<div className="flex gap-6 mobile:flex-col">
				{FOOTER_SECTIONS.map((section, i) => (
					<section key={i}>
						<h3 className="text-sm font-semibold uppercase tracking-wider">
							{section.title}
						</h3>
						<p className="text-justify">{section.content}</p>
					</section>
				))}
			</div>
			<Divider className="my-2" />
			<div className="flex justify-between mobile:flex-col mobile:items-center mobile:gap-2">
				<div>
					<span className="mr-1">&copy; {new Date().getFullYear()}</span>
					<a href="https://csclub.org.au/" className="underline">
						The University of Adelaide Computer Science Club
					</a>
				</div>
				<div className="flex gap-2 text-lg">
					{LINKS.map(({ icon: Icon, link }, i) => (
						<a href={link} key={i}>
							<Icon className="transition-colors hover:text-foreground" />
						</a>
					))}
				</div>
			</div>
		</footer>
	);
};
