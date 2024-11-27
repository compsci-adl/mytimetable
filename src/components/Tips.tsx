import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { shuffle } from '../utils/shuffle';

const TIPS = [
	<>
		Pinch on your trackpad or touchscreen to zoom in and out of your timetable.
	</>,
	<>
		Easily export your calendar to your devices via{' '}
		<a href="https://github.com/rayokamoto/AUDIT">AUDIT</a>.
	</>,
	<>
		Easily export your calendar to your devices via{' '}
		<a href="https://github.com/jsun969/audit-monkey">AUDIT Monkey</a>.
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
		Check the <a href="https://www.adelaide.edu.au/campuses/">campus map</a> if
		you can't find a location.
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
];

const tips = shuffle(TIPS);
const TIP_ANIMATION_SPEED = 8;

export const Tips = () => {
	const [tipIndex, setTipIndex] = useState(0);
	useEffect(() => {
		const interval = setInterval(() => {
			setTipIndex((t) => (t + 1) % TIPS.length);
		}, TIP_ANIMATION_SPEED * 1000);
		return () => clearInterval(interval);
	}, []);

	return (
		<AnimatePresence mode="wait">
			<motion.div
				key={tipIndex}
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={{ duration: 1 }}
				className="[&>a]:underline"
			>
				💡 {tips[tipIndex]}
			</motion.div>
		</AnimatePresence>
	);
};
