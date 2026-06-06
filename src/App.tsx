import { Calendar } from './components/Calendar';
import { EnrolledCourses } from './components/EnrolledCourses';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { HelpModal } from './components/HelpModal';
import { SearchForm } from './components/SearchForm';
import { SplashScreen } from './components/SplashScreen';
import { ZoomButtons } from './components/ZoomButtons';
import { useCoursesInfo } from './data/course-info';
import { useSplashScreen } from './helpers/splash-screen';

export const App = () => {
	useCoursesInfo();
	const showSplash = useSplashScreen((s) => s.showSplash);

	if (showSplash) {
		return <SplashScreen />;
	}

	return (
		<>
			<Header />
			<main className="mx-auto max-w-(--breakpoint-xl) space-y-4 px-2 py-4">
				<HelpModal />
				<ZoomButtons />
				<SearchForm />
				<EnrolledCourses />
				<Calendar />
				<Footer />
			</main>
		</>
	);
};
