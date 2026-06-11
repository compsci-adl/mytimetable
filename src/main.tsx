import '@fontsource-variable/outfit';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import { mountStoreDevtool } from 'simple-zustand-devtools';
import { Toaster } from 'sonner';

import { App } from './App';
import { Error } from './components/Error';
import { useEnrolledCourses } from './data/enrolled-courses';
import { useDarkMode } from './helpers/dark-mode';
import './i18n';
import './index.css';
import { queryClient } from './lib/query';

// MSW
const enableMocking = async () => {
	const { worker } = await import('./mocks/browser');
	return worker.start({
		onUnhandledRequest(request, print) {
			if (request.url.includes('/mock')) {
				return print.warning();
			}
		},
	});
};
if (import.meta.env.DEV) {
	await enableMocking();
}

// Zustand
if (import.meta.env.DEV) {
	mountStoreDevtool('Courses', useEnrolledCourses);
}

// Initialise system-aware dark mode
useDarkMode.getState().initDarkMode();

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<ErrorBoundary FallbackComponent={Error}>
			<QueryClientProvider client={queryClient}>
				<ReactQueryDevtools
					initialIsOpen={false}
					buttonPosition="bottom-left"
				/>
				<Toaster richColors position="top-center" />
				<App />
			</QueryClientProvider>
		</ErrorBoundary>
	</React.StrictMode>,
);
