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
			</main>
		</>
	);
};
