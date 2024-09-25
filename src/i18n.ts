import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import enAU from './locales/en-au.json';
import zhCN from './locales/zh-cn.json';

i18n
	.use(initReactI18next)
	.use(LanguageDetector)
	.init({
		resources: {
			'en-AU': { translation: enAU },
			'zh-CN': { translation: zhCN },
		},
		fallbackLng: 'en-AU',
	});

export default i18n;
