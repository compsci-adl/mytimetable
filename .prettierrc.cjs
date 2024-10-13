/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions & import('@trivago/prettier-plugin-sort-imports').PluginConfig} */
module.exports = {
	singleQuote: true,
	trailingComma: 'all',
	useTabs: true,
	plugins: [
		'@trivago/prettier-plugin-sort-imports',
		'prettier-plugin-tailwindcss',
	],
	importOrder: ['<THIRD_PARTY_MODULES>', '^[./]'],
	importOrderSeparation: true,
	endOfLine: 'lf',
};
