/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
	theme: {
		extend: {
			screens: {
				mobile: { max: '767px' },
			},
			fontSize: {
				'2xs': ['0.625rem', { lineHeight: '0.75rem' }],
			},
			colors: {
				eggshell: '#fdf9ee',
				sage: '#7a9a7e',
				tiger: '#fc8500',
				midnight: '#1c2321',
				primary: {
					DEFAULT: '#fc8500',
					foreground: '#000000',
				},
				separator: 'rgba(122, 154, 126, 0.35)',
			},
			fontFamily: {
				'noto-emoji': ['"Noto Color Emoji"', 'sans-serif'],
			},
		},
	},
	darkMode: 'class',
};
