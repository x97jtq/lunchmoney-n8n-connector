const { copyFileSync, mkdirSync } = require('node:fs');
const { dirname, join } = require('node:path');

const assets = [
	[
		'nodes/LunchMoney/lunchmoney.svg',
		'dist/nodes/LunchMoney/lunchmoney.svg',
	],
];

for (const [source, destination] of assets) {
	const target = join(process.cwd(), destination);
	mkdirSync(dirname(target), { recursive: true });
	copyFileSync(join(process.cwd(), source), target);
}
