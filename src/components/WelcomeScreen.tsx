import { Button, Card, Link, Tabs } from '@heroui/react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	FaCalendar,
	FaClipboardList,
	FaGithub,
	FaMapMarkerAlt,
	FaPalette,
	FaRobot,
	FaCheckCircle,
} from 'react-icons/fa';

import { getHelpSteps } from '../data/help-steps';
import { useWelcomeScreen } from '../helpers/welcome-screen';
import { Footer } from './Footer';
import { Header } from './Header';
import { MiniTimetableDemo } from './MiniTimetableDemo';

export const WelcomeScreen = () => {
	const closeWelcome = useWelcomeScreen((s) => s.closeWelcome);
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
			const snapEvent = e as unknown as { snapTargetBlock?: HTMLElement };
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

	const steps = getHelpSteps(t);

	return (
		<div className="bg-background selection:bg-primary/30 min-h-screen font-sans">
			<Header isWelcome />

			{/* Floating vertical pagination dots */}
			<div className="fixed top-1/2 left-6 z-50 hidden -translate-y-1/2 flex-col gap-3 md:flex">
				{[
					{ id: 'hero', label: 'Hero' },
					{ id: 'features', label: 'Features' },
					{ id: 'how-to-use', label: 'How to Use' },
					{ id: 'contribute-footer', label: 'Contribute' },
				].map((sec) => (
					<Button
						key={sec.id}
						onPress={() => {
							const el = document.getElementById(sec.id);
							if (el) {
								el.scrollIntoView({ behavior: 'smooth' });
							}
						}}
						className={`h-3 w-3 min-w-0 cursor-pointer rounded-full border-none bg-transparent p-0 shadow-none transition-all duration-300 ${
							activeSection === sec.id
								? 'bg-tiger scale-125 shadow-md'
								: 'bg-sage/50 hover:bg-sage hover:scale-110'
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
						<div className="group bg-content1/50 border-separator/85 relative rounded-3xl border p-3 shadow-xl transition-all duration-300 hover:scale-105">
							<img
								src="/favicon.svg"
								alt="MyTimetable Logo"
								className="h-12 w-12"
							/>
						</div>

						{/* Title & Badge */}
						<div className="space-y-2">
							<h1 className="text-foreground text-3xl font-black tracking-tight md:text-4xl">
								MyTimetable
							</h1>
							<div className="bg-primary/10 border-primary/20 text-primary inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold">
								<span>
									Made by the Adelaide University Computer Science Club
								</span>
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
								variant="primary"
								className="animate-grow-shrink rounded-full px-8 py-5 text-base font-bold shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl md:text-lg"
								onPress={closeWelcome}
							>
								Start scheduling!
							</Button>
						</div>
					</div>
				</section>

				{/* Section 2: Features Section */}
				<section
					id="features"
					className="mx-auto flex w-full max-w-6xl snap-start snap-always flex-col items-center justify-center px-4 pt-32 pb-8 text-center md:h-screen md:min-h-screen md:px-6 md:pt-24 md:pb-12"
				>
					<div className="w-full space-y-3 md:space-y-8">
						<h2 className="border-separator text-foreground border-b pb-2 text-center text-2xl font-extrabold md:pb-3 md:text-3xl">
							Powerful Features
						</h2>
						<div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-8">
							<Card className="bg-content1/50 border-separator hover:border-primary/50 rounded-3xl border shadow-md backdrop-blur-md transition-all duration-300 hover:-translate-y-1">
								<Card.Content className="flex flex-row items-start gap-3 p-4 md:gap-4 md:p-8">
									<FaPalette className="text-primary shrink-0 text-2xl md:text-5xl" />
									<div className="space-y-1 text-left">
										<h3 className="text-foreground text-base font-bold md:text-2xl">
											Visual Drag & Drop
										</h3>
										<p className="text-default-500 text-xs leading-snug md:text-base md:leading-relaxed">
											Drag classes directly on the calendar to swap times.
											Instantly preview alternative slots and fit classes to
											your preferred days.
										</p>
									</div>
								</Card.Content>
							</Card>

							<Card className="bg-content1/50 border-separator hover:border-primary/50 rounded-3xl border shadow-md backdrop-blur-md transition-all duration-300 hover:-translate-y-1">
								<Card.Content className="flex flex-row items-start gap-3 p-4 md:gap-4 md:p-8">
									<FaRobot className="text-primary shrink-0 text-2xl md:text-5xl" />
									<div className="space-y-1 text-left">
										<h3 className="text-foreground text-base font-bold md:text-2xl">
											Auto-Timetable Solver
										</h3>
										<p className="text-default-500 text-xs leading-snug md:text-base md:leading-relaxed">
											Define preferences (start/end times, preferred days, max
											days, and lunch breaks) and let our solver calculate the
											optimal timetable.
										</p>
									</div>
								</Card.Content>
							</Card>

							<Card className="bg-content1/50 border-separator hover:border-primary/50 rounded-3xl border shadow-md backdrop-blur-md transition-all duration-300 hover:-translate-y-1">
								<Card.Content className="flex flex-row items-start gap-3 p-4 md:gap-4 md:p-8">
									<FaCalendar className="text-primary shrink-0 text-2xl md:text-5xl" />
									<div className="space-y-1 text-left">
										<h3 className="text-foreground text-base font-bold md:text-2xl">
											Alternating Week Detection
										</h3>
										<p className="text-default-500 text-xs leading-snug md:text-base md:leading-relaxed">
											Fully date-aware clash checks support alternating weeks
											(e.g. tutorial one week, lecture the next at the same time
											slot).
										</p>
									</div>
								</Card.Content>
							</Card>

							<Card className="bg-content1/50 border-separator hover:border-primary/50 rounded-3xl border shadow-md backdrop-blur-md transition-all duration-300 hover:-translate-y-1">
								<Card.Content className="flex flex-row items-start gap-3 p-4 md:gap-4 md:p-8">
									<FaMapMarkerAlt className="text-primary shrink-0 text-2xl md:text-5xl" />
									<div className="space-y-1 text-left">
										<h3 className="text-foreground text-base font-bold md:text-2xl">
											Campus & Term Filtering
										</h3>
										<p className="text-default-500 text-xs leading-snug md:text-base md:leading-relaxed">
											Keep options relevant. Filters restrict variables,
											dropdown choices, and calendar slots to matches for your
											active term and campus.
										</p>
									</div>
								</Card.Content>
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
						<h2 className="border-separator text-foreground border-b pb-2 text-center text-3xl font-extrabold">
							How to Use
						</h2>

						<div className="flex flex-col items-center space-y-4 md:space-y-6">
							<Tabs
								selectedKey={String(stepIndex)}
								onSelectionChange={(key: React.Key) =>
									setStepIndex(Number(key))
								}
							>
								<Tabs.ListContainer className="self-center">
									<Tabs.List
										aria-label="How to Use Steps"
										className="bg-content2 border-separator flex max-w-full gap-1 overflow-x-auto rounded-full border p-1"
									>
										{steps.map((_, i) => (
											<Tabs.Tab
												key={i}
												id={String(i)}
												className={`relative rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
													stepIndex === i
														? 'text-primary-foreground font-black'
														: 'text-default-500 hover:text-foreground'
												}`}
											>
												{i + 1}
												<Tabs.Indicator className="bg-primary rounded-full" />
											</Tabs.Tab>
										))}
									</Tabs.List>
								</Tabs.ListContainer>
							</Tabs>

							<Card className="bg-content1/50 border-separator min-h-85 w-full rounded-3xl border shadow-lg backdrop-blur-md md:min-h-110">
								<Card.Content className="flex h-full flex-col gap-4 p-4 md:flex-row md:items-center md:gap-12 md:p-8">
									<div className="flex-1 space-y-4 text-left">
										<div className="bg-primary/10 text-primary border-primary/20 inline-flex h-12 w-12 items-center justify-center rounded-full border text-xl font-bold">
											{stepIndex + 1}
										</div>
										<p className="text-default-700 dark:text-foreground text-lg leading-relaxed font-semibold md:text-xl">
											{steps[stepIndex].content}
										</p>
									</div>

									<div className="flex flex-1 items-center justify-center">
										{steps[stepIndex].image?.path ? (
											<div className="border-separator bg-content2/30 flex h-40 w-full max-w-lg items-center justify-center overflow-hidden rounded-2xl border shadow-md md:h-75">
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
											<div className="bg-content2/20 border-separator flex h-40 w-full max-w-lg flex-col items-center justify-center rounded-2xl border border-dashed p-4 text-center select-none md:h-75 md:p-6">
												<FaCheckCircle className="text-success mb-2 text-4xl" />
												<span className="text-default-400 text-sm font-semibold">
													All set! You're ready to schedule.
												</span>
											</div>
										)}
									</div>
								</Card.Content>
							</Card>

							{/* Navigation controls */}
							<div className="flex w-full justify-between px-2">
								<Button
									variant="secondary"
									onPress={() => setStepIndex((prev) => Math.max(0, prev - 1))}
									className={
										stepIndex === 0
											? 'invisible'
											: 'visible rounded-full font-semibold'
									}
								>
									Previous Step
								</Button>
								{stepIndex < steps.length - 1 ? (
									<Button
										variant="primary"
										className="rounded-full px-6 font-semibold"
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
										variant="primary"
										className="rounded-full px-6 font-semibold"
										onPress={closeWelcome}
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
				className="mx-auto flex min-h-screen w-full max-w-5xl snap-start snap-always flex-col items-center gap-8 px-4 pt-24 pb-8 md:px-6"
			>
				<div className="flex w-full max-w-4xl grow flex-col items-center justify-center">
					<Card className="bg-content1/50 border-separator w-full rounded-3xl border p-6 text-center shadow-lg backdrop-blur-md">
						<Card.Content className="items-center space-y-4 p-2">
							<h3 className="text-foreground text-xl font-bold">
								Interested in Contributing?
							</h3>
							<p className="text-default-500 max-w-xl text-sm leading-relaxed">
								MyTimetable along with our backend Courses API, are student-led
								open-source projects created by the{' '}
								<strong className="text-foreground font-bold">
									Adelaide University Computer Science Club
								</strong>
								. If you find bugs, have feedback, or want to contribute to the
								frontend or backend, get involved!
							</p>
							<div className="flex flex-wrap justify-center gap-4 pt-2">
								<Link
									href="https://github.com/compsci-adl/mytimetable"
									target="_blank"
									rel="noopener noreferrer"
									className="border-separator bg-content2/30 text-foreground hover:text-primary hover:border-primary flex items-center gap-1.5 rounded-full border px-5 py-2 text-sm font-medium no-underline transition-colors"
								>
									<FaGithub />
									<span>Frontend Repo</span>
								</Link>
								<Link
									href="https://github.com/compsci-adl/courses-api"
									target="_blank"
									rel="noopener noreferrer"
									className="border-separator bg-content2/30 text-foreground hover:text-primary hover:border-primary flex items-center gap-1.5 rounded-full border px-5 py-2 text-sm font-medium no-underline transition-colors"
								>
									<FaGithub />
									<span>Backend Repo</span>
								</Link>
								<Link
									href={
										import.meta.env.VITE_FEEDBACK_FORM_URL ||
										'mailto:dev@csclub.org.au'
									}
									target="_blank"
									rel="noopener noreferrer"
									className="bg-primary text-primary-foreground flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-medium no-underline transition-opacity hover:opacity-80"
								>
									<FaClipboardList />
									<span>Submit Feedback</span>
								</Link>
							</div>
						</Card.Content>
					</Card>
				</div>
				<div className="mt-auto w-full">
					<Footer />
				</div>
			</section>
		</div>
	);
};
