/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API_BASE_URL: string;
	readonly VITE_YEAR: string;
	readonly VITE_FEEDBACK_FORM_URL: string;
	readonly VITE_FEEDBACK_FORM_URL_PREFILL_ERROR_MESSAGE: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
