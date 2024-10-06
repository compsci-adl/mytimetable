import { useState } from 'react';

export const useDarkMode = () => {
	const [isDarkMode, setIsDarkMode] = useState(
		matchMedia('(prefers-color-scheme: dark)').matches,
	);
	const toggleIsDarkMode = () => {
		document.body.classList.remove('dark:dark');
		if (isDarkMode) {
			document.body.classList.remove('dark');
		} else {
			document.body.classList.add('dark');
		}
		setIsDarkMode((m) => !m);
	};

	return { isDarkMode, toggleIsDarkMode };
};
