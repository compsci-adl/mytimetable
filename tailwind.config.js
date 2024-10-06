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
			colors: {},
			fontFamily: {
				'noto-emoji': ['"Noto Color Emoji"', 'sans-serif'],
			},
		},
	},
	darkMode: 'media',
	plugins: [
		nextui({
			themes: {
				light: {
					colors: {
						primary: { DEFAULT: '#FC8500', foreground: '#FFFFFF' },
						'apple-gray': { 300: '#DFDFDF', 500: '#AFAFAF' },
					},
				},
				dark: {
					colors: {
						primary: { DEFAULT: '#FC8500', foreground: '#FFFFFF' },
						foreground: '#D5D5D5',
						background: '#161718',
						'apple-gray': { 300: '#313131', 500: '#434444' },
					},
				},
			},
		}),
	],
};
