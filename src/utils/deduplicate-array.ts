export const deduplicateArray = <T>(array: Array<T>): Array<T> => {
	return [...new Set(array)];
};
