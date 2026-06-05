import { Button, Card, CardBody, Link, Tab, Tabs } from '@heroui/react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaClipboardList, FaGithub } from 'react-icons/fa';

import { useSplashScreen } from '../helpers/splash-screen';
import { Footer } from './Footer';
import { Header } from './Header';
import { MiniTimetableDemo } from './MiniTimetableDemo';

export const SplashScreen = () => {
	const closeSplash = useSplashScreen((s) => s.closeSplash);
	const { t } = useTranslation();
	const [stepIndex, setStepIndex] = useState(0);
	const [activeSection, setActiveSection] = useState('hero');

	React.useEffect(() => {
		document.documentElement.classList.add(
			'snap-y',
			'snap-mandatory',
			'scroll-smooth',
		);
		document.body.classList.add('snap-y', 'snap-mandatory', 'scroll-smooth');
		window.scrollTo(0, 0);

		const handleScrollSnapChange = (e: Event) => {
			const snapEvent = e as any;
			const target = snapEvent.snapTargetBlock;
			if (target && target.id) {
				setActiveSection(target.id);
			}
		};

		const supportsScrollSnapEvents =
			'onscrollsnapchange' in document || 'onscrollsnapchange' in window;

		let observer: IntersectionObserver | null = null;

		if (supportsScrollSnapEvents) {
			document.addEventListener('scrollsnapchange', handleScrollSnapChange);
		} else {
			// Fallback: Use IntersectionObserver to track activeSection on viewport scroll
			const options = {
				root: null,
				threshold: 0.5,
			};
			observer = new IntersectionObserver((entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting && entry.target.id) {
						setActiveSection(entry.target.id);
					}
				});
			}, options);

			const sections = ['hero', 'features', 'how-to-use', 'contribute-footer'];
			sections.forEach((id) => {
				const el = document.getElementById(id);
				if (el) observer?.observe(el);
			});
		}

		return () => {
			document.documentElement.classList.remove(
				'snap-y',
				'snap-mandatory',
				'scroll-smooth',
			);
			document.body.classList.remove(
				'snap-y',
				'snap-mandatory',
				'scroll-smooth',
			);
			if (supportsScrollSnapEvents) {
				document.removeEventListener(
					'scrollsnapchange',
					handleScrollSnapChange,
				);
			} else {
				observer?.disconnect();
			}
		};
	}, []);

	const steps = [
		{
			content: t('help.steps.welcome'),
			image: {
				path: '/help/welcome.webp',
				alt: 'Website preview',
			},
		},
		{
			content: t('help.steps.select-term'),
			image: {
				path: '/help/select-term.webp',
				alt: 'Select a term',
			},
		},
		{
			content: t('help.steps.search-course'),
			image: { path: '/help/search-course.webp', alt: 'Search a course' },
		},
		{
			content: t('help.steps.calendar-dnd'),
			image: {
				path: '/help/calendar.webp',
				alt: 'Drag and drop a course in calendar',
			},
		},
		{
			content: t('help.steps.change-week'),
			image: { path: '/help/change-week.webp', alt: 'Change calendar week' },
		},
		{
			content: t('help.steps.course-details'),
			image: {
				path: '/help/click-course.webp',
				alt: 'Highlighted enrolled course',
			},
		},
		{
			content: t('help.steps.course-modal'),
			image: {
				path: '/help/modal.webp',
				alt: 'Course modal to change class time',
			},
		},
		{
			content: t('help.steps.ready-button'),
			image: {
				path: '/help/ready-button.webp',
				alt: 'Ready button at bottom',
			},
		},
		{
			content: t('help.steps.access-adelaide'),
		},
	];

	return (
		<div className="bg-background selection:bg-primary/30 min-h-screen font-sans">
			<Header isSplash />

			{/* Floating vertical pagination dots */}
			<div className="fixed top-1/2 left-6 z-50 hidden -translate-y-1/2 flex-col gap-3 md:flex">
				{[
					{ id: 'hero', label: 'Hero' },
					{ id: 'features', label: 'Features' },
					{ id: 'how-to-use', label: 'How to Use' },
					{ id: 'contribute-footer', label: 'Contribute' },
				].map((sec) => (
					<button
						key={sec.id}
						onClick={() => {
							const el = document.getElementById(sec.id);
							if (el) {
								el.scrollIntoView({ behavior: 'smooth' });
							}
						}}
						className={`h-3 w-3 cursor-pointer rounded-full transition-all duration-300 ${
							activeSection === sec.id
								? 'bg-primary shadow-primary/30 scale-125 shadow-md'
								: 'bg-default-400/50 hover:bg-default-400 hover:scale-110'
						}`}
						aria-label={`Scroll to ${sec.label} section`}
					/>
				))}
			</div>

			<main className="w-full">
				{/* Section 1: Hero Section */}
				<section
					id="hero"
					className="mx-auto flex min-h-screen w-full max-w-4xl snap-start snap-always flex-col items-center justify-center px-4 pt-16 pb-6 text-center md:h-screen md:px-6 md:pt-20 md:pb-8"
				>
					<div className="flex flex-col items-center space-y-4 md:space-y-5">
						{/* Logo */}
						<div className="group bg-content1/50 border-divider relative rounded-2xl border p-2.5 shadow-xl transition-all duration-300 hover:scale-105">
							<img
								src="/favicon.svg"
								alt="MyTimetable Logo"
								className="h-12 w-12"
							/>
						</div>

						{/* Title & Badge */}
						<div className="space-y-2">
							<h1 className="text-primary text-3xl font-black tracking-tight md:text-4xl">
								MyTimetable
							</h1>
							<div className="bg-primary/10 border-primary/20 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold">
								<span>Made by Adelaide Uni CS Club</span>
							</div>
						</div>

						{/* Slogan & Drag-and-Drop Loop */}
						<div className="flex w-full max-w-3xl flex-col items-center space-y-4">
							<p className="text-default-600 text-base leading-relaxed font-medium md:text-lg">
								Adelaide University's smart scheduling companion. Drag, drop,
								and build your clash-free timetable in seconds.
							</p>

							{/* Mini-timetable drag demo ── */}
							<MiniTimetableDemo />
						</div>

						{/* Start Action Button */}
						<div className="pt-1">
							<Button
								size="lg"
								color="primary"
								className="shadow-primary/30 hover:shadow-primary/40 animate-grow-shrink px-8 py-5 text-base font-bold shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl md:text-lg"
								onPress={closeSplash}
								onClick={closeSplash}
							>
								Start scheduling!
							</Button>
						</div>
					</div>
				</section>

				{/* Section 2: Features Section */}
				<section
					id="features"
					className="mx-auto flex min-h-screen w-full max-w-6xl snap-start snap-always flex-col items-center justify-center px-4 pt-24 pb-12 text-center md:h-screen md:px-6"
				>
					<div className="w-full space-y-8">
						<h2 className="border-divider mb-2 border-b pb-3 text-center text-3xl font-extrabold">
							Powerful Features
						</h2>
						<div className="grid grid-cols-1 gap-8 md:grid-cols-2">
							<Card className="bg-content1/50 border-divider hover:border-primary/50 border shadow-md backdrop-blur-md transition-all duration-300 hover:-translate-y-1">
								<CardBody className="flex flex-row items-start gap-5 p-7 md:p-8">
									<span className="text-4xl md:text-5xl">🎨</span>
									<div className="space-y-1 text-left">
										<h3 className="text-xl font-bold md:text-2xl">
											Visual Drag & Drop
										</h3>
										<p className="text-default-500 text-base leading-relaxed">
											Drag classes directly on the calendar to swap times.
											Instantly preview alternative slots and fit classes to
											your preferred days.
										</p>
									</div>
								</CardBody>
							</Card>

							<Card className="bg-content1/50 border-divider hover:border-primary/50 border shadow-md backdrop-blur-md transition-all duration-300 hover:-translate-y-1">
								<CardBody className="flex flex-row items-start gap-5 p-7 md:p-8">
									<span className="text-4xl md:text-5xl">🤖</span>
									<div className="space-y-1 text-left">
										<h3 className="text-xl font-bold md:text-2xl">
											Auto-Timetable Solver
										</h3>
										<p className="text-default-500 text-base leading-relaxed">
											Define preferences (start/end times, preferred days, max
											days, and lunch breaks) and let our solver calculate the
											optimal timetable.
										</p>
									</div>
								</CardBody>
							</Card>

							<Card className="bg-content1/50 border-divider hover:border-primary/50 border shadow-md backdrop-blur-md transition-all duration-300 hover:-translate-y-1">
								<CardBody className="flex flex-row items-start gap-5 p-7 md:p-8">
									<span className="text-4xl md:text-5xl">📅</span>
									<div className="space-y-1 text-left">
										<h3 className="text-xl font-bold md:text-2xl">
											Alternating Week Detection
										</h3>
										<p className="text-default-500 text-base leading-relaxed">
											Fully date-aware clash checks support alternating weeks
											(e.g. tutorial one week, lecture the next at the same time
											slot).
										</p>
									</div>
								</CardBody>
							</Card>

							<Card className="bg-content1/50 border-divider hover:border-primary/50 border shadow-md backdrop-blur-md transition-all duration-300 hover:-translate-y-1">
								<CardBody className="flex flex-row items-start gap-5 p-7 md:p-8">
									<span className="text-4xl md:text-5xl">📍</span>
									<div className="space-y-1 text-left">
										<h3 className="text-xl font-bold md:text-2xl">
											Campus & Term Filtering
										</h3>
										<p className="text-default-500 text-base leading-relaxed">
											Keep options relevant. Filters restrict variables,
											dropdown choices, and calendar slots to matches for your
											active term and campus.
										</p>
									</div>
								</CardBody>
							</Card>
						</div>
					</div>
				</section>

				{/* Section 3: How to Use Section */}
				<section
					id="how-to-use"
					className="mx-auto flex min-h-screen w-full max-w-5xl snap-start snap-always flex-col items-center justify-center px-4 pt-16 pb-8 text-center md:h-screen md:px-6 md:pt-24 md:pb-12"
				>
					<div className="w-full space-y-4 md:space-y-8">
						<h2 className="border-divider border-b pb-2 text-center text-2xl font-bold">
							How to Use
						</h2>

						<div className="flex flex-col items-center space-y-4 md:space-y-6">
							<Tabs
								aria-label="How to Use Steps"
								selectedKey={String(stepIndex)}
								onSelectionChange={(key) => setStepIndex(Number(key))}
								variant="solid"
								color="primary"
								className="max-w-full overflow-x-auto"
							>
								{steps.map((_, i) => (
									<Tab key={i} title={String(i + 1)} />
								))}
							</Tabs>

							<Card className="bg-content1/50 border-divider min-h-[340px] w-full border shadow-lg backdrop-blur-md md:min-h-[440px]">
								<CardBody className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:gap-12 md:p-8">
									<div className="flex-1 space-y-4 text-left">
										<div className="bg-primary/10 text-primary border-primary/20 inline-flex h-12 w-12 items-center justify-center rounded-full border text-xl font-bold">
											{stepIndex + 1}
										</div>
										<p className="text-default-700 text-lg leading-relaxed font-medium md:text-xl">
											{steps[stepIndex].content}
										</p>
									</div>

									<div className="flex flex-1 items-center justify-center">
										{steps[stepIndex].image?.path ? (
											<div className="border-divider bg-content2/30 flex h-[160px] w-full max-w-lg items-center justify-center overflow-hidden rounded-2xl border shadow-md md:h-[360px]">
												<img
													src={steps[stepIndex].image.path}
													alt={
														steps[stepIndex].image.alt ??
														steps[stepIndex].content
													}
													className="h-full w-full object-contain"
												/>
											</div>
										) : (
											<div className="bg-content2/20 border-divider flex h-[160px] w-full max-w-lg flex-col items-center justify-center rounded-2xl border border-dashed p-4 text-center select-none md:h-[360px] md:p-6">
												<span className="mb-2 text-4xl">🎉</span>
												<span className="text-default-400 text-sm font-semibold">
													All set! You're ready to schedule.
												</span>
											</div>
										)}
									</div>
								</CardBody>
							</Card>

							{/* Navigation controls */}
							<div className="flex w-full justify-between px-2">
								<Button
									color="primary"
									variant="flat"
									onPress={() => setStepIndex((prev) => Math.max(0, prev - 1))}
									className={
										stepIndex === 0 ? 'invisible' : 'visible text-black'
									}
								>
									Previous Step
								</Button>
								{stepIndex < steps.length - 1 ? (
									<Button
										color="primary"
										onPress={() =>
											setStepIndex((prev) =>
												Math.min(steps.length - 1, prev + 1),
											)
										}
									>
										Next Step
									</Button>
								) : (
									<Button
										color="primary"
										onPress={closeSplash}
										onClick={closeSplash}
									>
										Get Started!
									</Button>
								)}
							</div>
						</div>
					</div>
				</section>
			</main>

			{/* Section 4: Contribute & Footer Section (outside main to avoid strict mode heading conflicts) */}
			<section
				id="contribute-footer"
				className="mx-auto flex min-h-screen w-full max-w-5xl snap-start snap-always flex-col items-center justify-between px-4 pt-24 pb-8 md:h-screen md:px-6"
			>
				<div className="flex w-full max-w-4xl flex-1 flex-col items-center justify-center">
					<Card className="bg-content1/50 border-divider w-full border p-6 text-center shadow-lg backdrop-blur-md">
						<CardBody className="items-center space-y-4 p-2">
							<h3 className="text-xl font-bold">Interested in Contributing?</h3>
							<p className="text-default-500 max-w-xl text-sm leading-relaxed">
								MyTimetable along with our backend Courses API, are student-led
								open-source projects created by the{' '}
								<strong className="text-foreground font-bold">
									Adelaide University Computer Science Club
								</strong>
								. If you find bugs, have feedback, or want to contribute to the
								frontend or backend, get involved!
							</p>
							<div className="flex flex-wrap justify-center gap-4">
								<Button
									as={Link}
									href="https://github.com/compsci-adl/mytimetable"
									target="_blank"
									variant="bordered"
									startContent={<FaGithub />}
									className="hover:text-primary font-medium transition-colors"
								>
									Frontend Repo
								</Button>
								<Button
									as={Link}
									href="https://github.com/compsci-adl/courses-api"
									target="_blank"
									variant="bordered"
									startContent={<FaGithub />}
									className="hover:text-primary font-medium transition-colors"
								>
									Backend Repo
								</Button>
								<Button
									as={Link}
									href={
										import.meta.env.VITE_FEEDBACK_FORM_URL ||
										'mailto:dev@csclub.org.au'
									}
									target="_blank"
									color="secondary"
									variant="flat"
									startContent={<FaClipboardList />}
									className="font-medium"
								>
									Submit Feedback
								</Button>
							</div>
						</CardBody>
					</Card>
				</div>
				<div className="mt-6 w-full">
					<Footer />
				</div>
			</section>
		</div>
	);
};
