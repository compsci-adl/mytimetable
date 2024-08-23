import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

export const useQueryLoading = (queryKey: QueryKey) => {
	const queryClient = useQueryClient();
	const [isLoading, setIsLoading] = useState(true);
	useEffect(() => {
		setIsLoading(queryClient.getQueryState(queryKey)?.status === 'pending');
	}, [queryKey, setIsLoading, queryClient]);
	return isLoading;
};
