import {
	draggable,
	dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import type { DependencyList, MutableRefObject } from 'react';
import { useEffect } from 'react';

export const useDrag = <T extends HTMLElement | null>(
	ref: MutableRefObject<T>,
	props: Omit<Parameters<typeof draggable>[0], 'element'>,
	deps: DependencyList = [],
) => {
	useEffect(() => {
		const element = ref.current;
		if (!element) return;
		return draggable({
			element,
			...props,
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps);
};

export const useDrop = <T extends HTMLElement | null>(
	ref: MutableRefObject<T>,
	props: Omit<Parameters<typeof dropTargetForElements>[0], 'element'>,
	deps: DependencyList = [],
) => {
	useEffect(() => {
		const element = ref.current;
		if (!element) return;
		return dropTargetForElements({
			element,
			...props,
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps);
};
