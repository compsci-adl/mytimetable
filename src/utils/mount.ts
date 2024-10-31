import { useEffect, useRef } from 'react';

export const useMount = (fn: React.EffectCallback) => {
	const isMounted = useRef(false);
	useEffect(() => {
		if (!isMounted.current) {
			fn();
			isMounted.current = true;
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
};
