import { nextui } from '@nextui-org/react';

/** @type {import('tailwindcss').Config} */
export default {
	content: [
		'./index.html',
		'./src/**/*.{js,ts,jsx,tsx}',
		'./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}',
	],
	theme: {
		extend: {
			screens: {
				mobile: { max: '767px' },
			},
			fontSize: {
				'2xs': ['0.625rem', { lineHeight: '0.75rem' }],
			},
			colors: {
				'apple-gray': { 300: '#DFDFDF', 500: '#AFAFAF' },
			},
		},
	},
	darkMode: 'class',
	plugins: [nextui()],
};
