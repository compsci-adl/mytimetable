import { Calendar } from './components/Calendar';
import { EnrolledCourses } from './components/EnrolledCourses';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { SearchForm } from './components/SearchForm';
import { useCoursesInfo } from './data/course-info';

export const App = () => {
	useCoursesInfo();

	return (
		<>
			<Header />
			<main className="mx-auto my-4 max-w-screen-xl space-y-4 px-2">
				<SearchForm />
				<EnrolledCourses />
				<Calendar />
				<Footer />
			</main>
		</>
	);
};
