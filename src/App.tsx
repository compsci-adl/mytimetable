import { Calendar } from './components/Calendar';
import { EnrolledCourses } from './components/EnrolledCourses';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { HelpModal } from './components/HelpModal';
import { SearchForm } from './components/SearchForm';
import { useCoursesInfo } from './data/course-info';
import { useFirstTimeHelp } from './helpers/help-modal';
import { useCalendarZoom } from './helpers/zoom';

export const App = () => {
	useCoursesInfo();
	useFirstTimeHelp();
	useCalendarZoom();

	return (
		<>
			<Header />
			<main className="mx-auto my-4 max-w-screen-xl space-y-4 px-2">
				<HelpModal />
				<SearchForm />
				<EnrolledCourses />
				<Calendar />
				<Footer />
			</main>
		</>
	);
};
