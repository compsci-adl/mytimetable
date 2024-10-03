import { useCallback, useEffect, useRef } from 'react';

import { useCalendarHourHeight } from './calendar-hour-height';

type UseZoomProps = {
	element: HTMLElement;
	onWheelZoom: (deltaY: number) => void;
	onPinchZoom: (distanceDiff: number) => void;
};
const useZoom = ({ element, onPinchZoom, onWheelZoom }: UseZoomProps) => {
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
				onPinchZoom(distanceDiff);
			}
			prevDistance.current = currentDistance;
		},
		[onPinchZoom],
	);
	const onPointerUp = useCallback((e: PointerEvent) => {
		pointers.current = pointers.current.filter(
			(p) => p.pointerId !== e.pointerId,
		);
		if (pointers.current.length < 2) {
			prevDistance.current = -1;
		}
	}, []);

	// Trackpad (Laptop) zoom
	const onWheel = useCallback(
		(e: WheelEvent) => {
			// Check if user is scrolling
			if (e.deltaY % 1 === 0) return;
			e.preventDefault();
			e.stopPropagation();
			onWheelZoom(e.deltaY);
		},
		[onWheelZoom],
	);

	useEffect(() => {
		element.addEventListener('wheel', onWheel, { passive: false });
		element.addEventListener('pointerdown', onPointerDown);
		element.addEventListener('pointermove', onPointerMove);
		element.addEventListener('pointerup', onPointerUp);
		element.addEventListener('pointercancel', onPointerUp);
		element.addEventListener('pointerout', onPointerUp);
		element.addEventListener('pointerleave', onPointerUp);
		return () => {
			element.removeEventListener('wheel', onWheel);
			element.removeEventListener('pointerdown', onPointerDown);
			element.removeEventListener('pointermove', onPointerMove);
			element.removeEventListener('pointerup', onPointerUp);
			element.removeEventListener('pointercancel', onPointerUp);
			element.removeEventListener('pointerout', onPointerUp);
			element.removeEventListener('pointerleave', onPointerUp);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [onWheel, onPointerDown, onPointerMove, onPointerUp]);
};

const WHEEL_SPEED = 0.08;
const PINCH_SPEED = 0.03;
export const useCalendarZoom = () => {
	const setCalendarHeight = useCalendarHourHeight((s) => s.setHeight);
	useZoom({
		element: document.body,
		onWheelZoom: (deltaY) => {
			setCalendarHeight((h) => h - deltaY * WHEEL_SPEED);
		},
		onPinchZoom: (distanceDiff) => {
			setCalendarHeight((h) => h + distanceDiff * PINCH_SPEED);
		},
	});
};
