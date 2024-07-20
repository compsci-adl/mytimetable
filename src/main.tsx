import { NextUIProvider } from '@nextui-org/react';
import React from 'react';
import ReactDOM from 'react-dom/client';

import { App } from './App';
import './index.css';

const enableMocking = async () => {
	if (!import.meta.env.DEV) return;
	const { worker } = await import('./mocks/browser');
	return worker.start();
};

await enableMocking();
ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<NextUIProvider>
			<App />
		</NextUIProvider>
	</React.StrictMode>,
);
