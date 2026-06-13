import ky, { type Options } from 'ky';

const defaultOptions: Options = {
	prefix: import.meta.env.VITE_API_BASE_URL,
};

export const fetcher = ky.create(defaultOptions);
