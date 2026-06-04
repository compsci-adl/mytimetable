import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		VitePWA({
			registerType: 'autoUpdate',
			includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'favicon.svg'],
			manifest: {
				name: 'MyTimetable',
				short_name: 'MyTimetable',
				description:
					'MyTimetable is a simple drag-and-drop timetable planner for Adelaide University students.',
				display: 'standalone',
				background_color: '#FFFFFF',
				theme_color: '#FC8500',
				icons: [
					{
						src: 'pwa-192x192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any',
					},
					{
						src: 'pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any',
					},
					{
						src: 'pwa-maskable-192x192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'maskable',
					},
					{
						src: 'pwa-maskable-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable',
					},
				],
			},
		}),
		tailwindcss(),
	],
	test: {
		globals: true,
		include: ['tests/unit/**/*.test.ts'],
		env: { VITE_YEAR: '2024' },
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			thresholds: {
				lines: 100,
				statements: 100,
				functions: 100,
				branches: 100,
			},
			exclude: [
				'node_modules/**',
				'dist/**',
				'tests/unit/**',
				'vite.config.ts',
				'eslint.config.js',
				'tailwind.config.js',
				'src/mocks/**',
				'src/main.tsx',
				'src/vite-env.d.ts',
				'src/components/**',
				'src/locales/**',
				'src/data/course-info.ts',
				'**/*.json',
			],
		},
	},
});
