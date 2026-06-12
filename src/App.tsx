import { Calendar } from './components/Calendar';
import { ChangelogModal } from './components/ChangelogModal';
import { EnrolledCourses } from './components/EnrolledCourses';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { HelpModal } from './components/HelpModal';
import { SearchForm } from './components/SearchForm';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ZoomButtons } from './components/ZoomButtons';
import { useCoursesInfo } from './data/course-info';
import { useWelcomeScreen } from './helpers/welcome-screen';

export const App = () => {
	useCoursesInfo();
	const showWelcome = useWelcomeScreen((s) => s.showWelcome);

	if (showWelcome) {
		return <WelcomeScreen />;
	}

	return (
		<>
			<Header />
			<main className="mx-auto max-w-(--breakpoint-xl) space-y-4 px-2 py-4">
				<HelpModal />
				<ChangelogModal />
				<ZoomButtons />
				<SearchForm />
				<EnrolledCourses />
				<Calendar />
				<Footer />
			</main>
		</>
	);
};
