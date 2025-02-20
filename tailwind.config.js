import { heroui } from '@heroui/react';

/** @type {import('tailwindcss').Config} */
export default {
	content: [
		'./index.html',
		'./src/**/*.{js,ts,jsx,tsx}',
		'./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
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
		heroui({
			themes: {
				light: {
					colors: {
						primary: { DEFAULT: '#FC8500', foreground: '#000000' },
						'apple-gray': { 300: '#DFDFDF', 500: '#AFAFAF', 700: '#6b6b6b' },
						// Calendar Event Colors
						// 300 - bg, 500 - border, 700 - text
						'apple-blue': { 300: '#C9E6FE', 500: '#1D9BF6', 700: '#1D6AA1' },
						'apple-purple': { 300: '#EACDF4', 500: '#AF38D1', 700: '#762C8B' },
						'apple-green': { 300: '#D4F6C9', 500: '#4AD321', 700: '#3E8522' },
						'apple-orange': { 300: '#FEDBC4', 500: '#FA6D0D', 700: '#A75117' },
						'apple-yellow': { 300: '#FDEEC3', 500: '#FCB80F', 700: '#936E10' },
						'apple-brown': { 300: '#DFD8CF', 500: '#7D5E3B', 700: '#5E4D39' },
						'apple-red': { 300: '#FEBFD1', 500: '#F50445', 700: '#BB1644' },
						'not-found': { 300: '#D3D3D3', 500: '#000000', 700: '#000000' },
					},
				},
				dark: {
					colors: {
						primary: { DEFAULT: '#FC8500', foreground: '#000000' },
						foreground: '#D5D5D5',
						background: '#161718',
						'apple-gray': { 300: '#313131', 500: '#434444', 700: '#8F8F8F' },
						'apple-blue': { 300: '#19283B', 500: '#1D9BF6', 700: '#1D9BF6' },
						'apple-purple': { 300: '#2F1E36', 500: '#BF58DA', 700: '#BF57DA' },
						'apple-green': { 300: '#1D341F', 500: '#30D33B', 700: '#30D33B' },
						'apple-orange': { 300: '#38271A', 500: '#FD8208', 700: '#FD8208' },
						'apple-yellow': { 300: '#39341C', 500: '#FECE0F', 700: '#FED10E' },
						'apple-brown': { 300: '#292621', 500: '#9B7C55', 700: '#9B7C55' },
						'apple-red': { 300: '#391A21', 500: '#E51167', 700: '#E51166' },
						'not-found': { 300: '#404040', 500: '#FFFFFF', 700: '#FFFFFF' },
					},
				},
			},
		}),
	],
};
