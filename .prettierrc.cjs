/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions & import('@trivago/prettier-plugin-sort-imports').PluginConfig} */
module.exports = {
	singleQuote: true,
	trailingComma: 'all',
	useTabs: true,
	plugins: [
		require.resolve('prettier-plugin-tailwindcss'),
		require.resolve('@trivago/prettier-plugin-sort-imports'),
	],
	importOrder: ['<THIRD_PARTY_MODULES>', '^[./]'],
	importOrderSeparation: true,
};
