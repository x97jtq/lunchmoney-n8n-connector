module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project: ['./tsconfig.json'],
		tsconfigRootDir: __dirname,
	},
	plugins: ['@typescript-eslint'],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
	],
	env: {
		es2022: true,
		node: true,
		jest: true,
	},
	ignorePatterns: ['dist/', 'coverage/', 'node_modules/', '*.tgz'],
	rules: {
		'@typescript-eslint/no-explicit-any': 'off',
	},
};
