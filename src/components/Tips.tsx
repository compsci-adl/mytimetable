import { useEffect, useState } from 'react';
import { FaLightbulb } from 'react-icons/fa';

import { shuffle } from '../utils/shuffle';

const TIPS = [
	<>
		Pinch on your trackpad or touchscreen to zoom in and out of your timetable.
	</>,
	<>The class number will be copied if you drag it outside the window.</>,
	<>
		We're looking for{' '}
		<a href="https://github.com/compsci-adl/mytimetable/issues/9">
			translations in multiple languages
		</a>
		.
	</>,
	<>
		Share your thoughts to help us improve via{' '}
		<a href={import.meta.env.VITE_FEEDBACK_FORM_URL}>feedback</a>.
	</>,
	<>
		This project is open-source on{' '}
		<a href="https://github.com/compsci-adl/mytimetable">GitHub</a>
	</>,
	<>
		Join the <a href="https://csclub.org.au">CS Club</a>, a community open to
		everyone interested in computer science.
	</>,
	<>
		Join the{' '}
		<a href="https://csclub.org.au/open-source">CS Club Open Source Team</a> to
		work on projects like this!
	</>,
	<>You can search for courses using abbreviations</>,
];

const tips = shuffle(TIPS);
const TIP_ANIMATION_SPEED = 8;

export const Tips = () => {
	const [tipIndex, setTipIndex] = useState(0);
	const [opacity, setOpacity] = useState('opacity-100');

	useEffect(() => {
		const interval = setInterval(() => {
			setOpacity('opacity-0');
			setTimeout(() => {
				setTipIndex((t) => (t + 1) % TIPS.length);
				setOpacity('opacity-100');
			}, 500);
		}, TIP_ANIMATION_SPEED * 1000);
		return () => clearInterval(interval);
	}, []);

	return (
		<div
			className={`flex h-10 items-center justify-center gap-1.5 text-sm leading-5 transition-opacity duration-500 ease-in-out md:h-auto [&>a]:underline ${opacity}`}
		>
			<FaLightbulb className="shrink-0 text-xs text-amber-400" />
			<span>{tips[tipIndex]}</span>
		</div>
	);
};
