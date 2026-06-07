import { Link } from '@heroui/react';
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
		<div className="mx-2 flex h-dvh flex-col items-center justify-center gap-2 text-center">
			<h1 className="text-foreground text-4xl font-extrabold">
				Oops... Something went wrong!
			</h1>
			<p className="text-default-500 max-w-md">
				We're sorry, but we need to clear all saved data for this website
				(including any locally stored courses and times).
			</p>
			<code className="bg-content2 border-separator text-danger block max-w-md overflow-x-auto rounded-2xl border p-4 text-left font-mono text-xs font-semibold whitespace-pre-wrap">
				<span className="text-foreground font-bold">Error Message:</span> <br />
				{errorMessage}
			</code>
			<p className="text-default-500 mt-2">
				Before refreshing the page, would you like to{' '}
				<Link
					target="_blank"
					rel="noopener noreferrer"
					href={prefilledFeedbackForm}
					className="text-primary underline"
				>
					send us feedback
				</Link>{' '}
				along with the error message to help improve our app?
			</p>
		</div>
	);
};
