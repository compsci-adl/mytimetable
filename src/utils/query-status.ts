import { useQuery, type QueryKey } from '@tanstack/react-query';

export const useQueryStatus = (queryKey: QueryKey) => {
	const { isLoading, isError } = useQuery({
		queryKey,
		queryFn: () => {
			return Promise.resolve(null);
		},
		enabled: false,
		retry: false,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});

	return { isLoading, isError };
};
