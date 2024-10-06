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
					'A drag-and-drop timetable planner for the University of Adelaide students.',
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
	],
	test: {
		globals: true,
		env: { VITE_YEAR: '2024' },
	},
});
