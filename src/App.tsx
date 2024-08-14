import { EnrolledCourses } from './components/EnrolledCourses';
import { Header } from './components/Header';
import { SearchForm } from './components/SearchForm';
import { Timetable } from './components/Timetable';

export const App = () => {
	return (
		<>
			<Header />
			<main className="mx-auto my-4 max-w-screen-xl space-y-4 px-2">
				<SearchForm />
				<EnrolledCourses />
				<Timetable />
			</main>
		</>
	);
};
