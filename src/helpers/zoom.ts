import { useCallback, useEffect, useRef } from 'react';

import { useCalendarHourHeight } from './calendar';

const WHEEL_SPEED = 0.08;
const PINCH_SPEED = 0.03;

export const useZoom = () => {
	const setCalendarHeight = useCalendarHourHeight((s) => s.setHeight);

	// Pinch (Tablet or phone) zoom
	// FIXME: Not so smooth on safari, sometimes detect as scroll
	const pointers = useRef<PointerEvent[]>([]);
	const prevDistance = useRef<number>(-1);
	const onPointerDown = useCallback((e: PointerEvent) => {
		pointers.current.push(e);
	}, []);
	const onPointerMove = useCallback(
		(e: PointerEvent) => {
			if (pointers.current.length !== 2) return;

			const index = pointers.current.findIndex(
				(p) => p.pointerId === e.pointerId,
			);
			if (index === -1) return;
			pointers.current[index] = e;

			const firstPointer = pointers.current[0];
			const secondPointer = pointers.current[1];
			const currentDistance = Math.hypot(
				secondPointer.clientX - firstPointer.clientX,
				secondPointer.clientY - firstPointer.clientY,
			);
			const distanceDiff = currentDistance - prevDistance.current;
			if (prevDistance.current !== -1) {
				setCalendarHeight((h) => h + distanceDiff * PINCH_SPEED);
			}
			prevDistance.current = currentDistance;
		},
		[setCalendarHeight],
	);
	const onPointerUp = useCallback((e: PointerEvent) => {
		pointers.current = pointers.current.filter(
			(p) => p.pointerId !== e.pointerId,
		);
		if (pointers.current.length < 2) prevDistance.current = -1;
	}, []);

	// Trackpad (Laptop) zoom
	const onWheel = useCallback(
		(e: WheelEvent) => {
			// Check if user is scrolling
			if (e.deltaY % 1 === 0) return;
			e.preventDefault();
			e.stopPropagation();
			setCalendarHeight((h) => h - e.deltaY * WHEEL_SPEED);
		},
		[setCalendarHeight],
	);

	useEffect(() => {
		document.addEventListener('wheel', onWheel, { passive: false });
		document.addEventListener('pointerdown', onPointerDown);
		document.addEventListener('pointermove', onPointerMove);
		document.addEventListener('pointerup', onPointerUp);
		document.addEventListener('pointercancel', onPointerUp);
		document.addEventListener('pointerout', onPointerUp);
		document.addEventListener('pointerleave', onPointerUp);
		return () => {
			document.removeEventListener('wheel', onWheel);
			document.removeEventListener('pointerdown', onPointerDown);
			document.removeEventListener('pointermove', onPointerMove);
			document.removeEventListener('pointerup', onPointerUp);
			document.removeEventListener('pointercancel', onPointerUp);
			document.removeEventListener('pointerout', onPointerUp);
			document.removeEventListener('pointerleave', onPointerUp);
		};
	}, [onWheel, onPointerDown, onPointerMove, onPointerUp]);
};
