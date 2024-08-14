import { EnrolledCourses } from './components/EnrolledCourses';
import { Header } from './components/Header';
import { SearchForm } from './components/SearchForm';

export const App = () => {
	return (
		<>
			<Header />
			<main className="mx-auto max-w-screen-xl space-y-4 px-2">
				<SearchForm />
				<EnrolledCourses />
			</main>
		</>
	);
};
