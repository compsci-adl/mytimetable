import { useCallback, useEffect } from 'react';

import { useCalendarHourHeight } from './calendar';

const MIN_HEIGHT = 3;
const MAX_HEIGHT = 10;
const SPEED = 0.08;

export const useZoom = () => {
	const setCalendarHeight = useCalendarHourHeight((s) => s.setHeight);

	const onZoom = useCallback(
		(e: WheelEvent) => {
			// Check if user is scrolling
			if (e.deltaY % 1 === 0) return;
			e.preventDefault();
			e.stopPropagation();
			setCalendarHeight((previousHeight) => {
				const newHeight = previousHeight - e.deltaY * SPEED;
				const height = Math.min(Math.max(newHeight, MIN_HEIGHT), MAX_HEIGHT);
				return height;
			});
		},
		[setCalendarHeight],
	);

	useEffect(() => {
		document.addEventListener('wheel', onZoom, { passive: false });
		return () => {
			document.removeEventListener('wheel', onZoom);
		};
	}, [onZoom]);
};
