module.exports = {
	root: true,
	env: { browser: true, es2020: true },
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:react-hooks/recommended',
		'plugin:prettier/recommended',
	],
	ignorePatterns: ['dist', '.eslintrc.cjs'],
	parser: '@typescript-eslint/parser',
	plugins: ['react-refresh'],
	ignorePatterns: ['*.cjs', '*.mjs'],
	rules: {
		'react-refresh/only-export-components': [
			'warn',
			{ allowConstantExport: true },
		],
		'@typescript-eslint/explicit-function-return-type': 'off',
		'@typescript-eslint/explicit-module-boundary-types': 'off',
		'@typescript-eslint/no-non-null-assertion': 'off',
		'@typescript-eslint/no-unused-vars': ['warn', { ignoreRestSiblings: true }],
		'@typescript-eslint/consistent-type-imports': [
			'warn',
			{ disallowTypeAnnotations: false },
		],
		'no-console': 'warn',
		eqeqeq: 'warn',
		'prefer-const': 'warn',
		'no-var': 'warn',
	},
};
