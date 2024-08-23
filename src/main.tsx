import '@fontsource-variable/outfit';
import { NextUIProvider } from '@nextui-org/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { mountStoreDevtool } from 'simple-zustand-devtools';

import { App } from './App';
import { useEnrolledCourses } from './data/enrolled-courses';
import './index.css';
import { queryClient } from './lib/query';

const enableMocking = async () => {
	if (!import.meta.env.DEV) return;
	const { worker } = await import('./mocks/browser');
	return worker.start();
};
await enableMocking();

if (import.meta.env.DEV) {
	mountStoreDevtool('Courses', useEnrolledCourses);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<ReactQueryDevtools initialIsOpen={false} />
			<NextUIProvider>
				<App />
			</NextUIProvider>
		</QueryClientProvider>
	</React.StrictMode>,
);
