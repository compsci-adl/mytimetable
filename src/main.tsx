import '@fontsource-variable/outfit';
import { NextUIProvider } from '@nextui-org/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { mountStoreDevtool } from 'simple-zustand-devtools';

import { App } from './App';
import './index.css';
import { useCourses } from './store/courses';

const enableMocking = async () => {
	if (!import.meta.env.DEV) return;
	const { worker } = await import('./mocks/browser');
	return worker.start();
};
await enableMocking();

if (import.meta.env.DEV) {
	mountStoreDevtool('Courses', useCourses);
}

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<NextUIProvider>
				<App />
			</NextUIProvider>
		</QueryClientProvider>
	</React.StrictMode>,
);
