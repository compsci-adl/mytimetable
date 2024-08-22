import ky from 'ky';

export const fetcher = ky.create({
	prefixUrl: import.meta.env.VITE_API_BASE_URL,
});
