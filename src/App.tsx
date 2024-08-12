import { Header } from './components/Header';
import { SearchForm } from './components/SearchForm';

export const App = () => {
	return (
		<>
			<Header />
			<main className="mx-auto max-w-screen-xl px-2">
				<SearchForm />
			</main>
		</>
	);
};
