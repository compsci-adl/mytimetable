import { Button } from '@nextui-org/react';

import { Header } from './components/Header';

export const App = () => {
	return (
		<>
			<Header />
			<main>
				<Button
					color="primary"
					onClick={async () => {
						const test = await fetch('/api/courses');
						const data = await test.json();
						console.log(data);
					}}
				>
					LOL
				</Button>
				<Button
					color="primary"
					onClick={async () => {
						const test = await fetch('/api/course/107592');
						const data = await test.json();
						console.log(data);
					}}
				>
					OLO
				</Button>
			</main>
		</>
	);
};
