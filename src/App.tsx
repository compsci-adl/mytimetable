import { Calendar } from './components/Calendar';
import { EnrolledCourses } from './components/EnrolledCourses';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { HelpModal } from './components/HelpModal';
import { SearchForm } from './components/SearchForm';
import { ZoomButtons } from './components/ZoomButtons';
import { useCoursesInfo } from './data/course-info';
import { useFirstTimeHelp } from './helpers/help-modal';

export const App = () => {
	useCoursesInfo();
	useFirstTimeHelp();

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
