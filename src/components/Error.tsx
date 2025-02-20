import { Code, Link } from '@heroui/react';
import type { FallbackProps } from 'react-error-boundary';

import { useMount } from '../utils/mount';

export const Error = ({ error }: FallbackProps) => {
	const errorMessage = String(error);
	const prefilledFeedbackForm = `${import.meta.env.VITE_FEEDBACK_FORM_URL_PREFILL_ERROR_MESSAGE}${errorMessage}%0ACause:+`;

	useMount(() => {
		// Clear local data to reset the app
		localStorage.clear();
	});

	return (
		<div className="mx-2 flex h-dvh flex-col items-center justify-center gap-2">
			<h1 className="text-4xl">Oops... Something went wrong!</h1>
			<p>
				We're sorry, but we need to clear all saved data for this website
				(including any locally stored courses and times).
			</p>
			<Code size="lg" className="max-w-full overflow-x-auto p-2">
				<span className="font-bold">Error Message:</span> <br />
				{errorMessage}
			</Code>
			<p>
				Before refreshing the page, would you like to{' '}
				<Link isExternal href={prefilledFeedbackForm}>
					send us feedback
				</Link>{' '}
				along with the error message to help improve our app?
			</p>
		</div>
	);
};
