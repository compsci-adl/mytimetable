import {
	draggable,
	dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import type { DependencyList, RefObject } from 'react';
import { useEffect } from 'react';

export const useDrag = <T extends HTMLElement | null>(
	ref: RefObject<T>,
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
	}, [props, ref, deps]);
};

export const useDrop = <T extends HTMLElement | null>(
	ref: RefObject<T>,
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
	}, [props, ref, deps]);
};
