import packageJson from '../package.json';

describe('package metadata', () => {
	it('uses the public n8n community node package name', () => {
		expect(packageJson.name).toBe('n8n-nodes-lunchmoney');
	});

	it('includes the n8n community node keyword', () => {
		expect(packageJson.keywords).toContain('n8n-community-node-package');
	});

	it('declares n8n node and credential entry points', () => {
		expect(packageJson.n8n.credentials).toEqual([
			'dist/credentials/LunchMoneyApi.credentials.js',
		]);
		expect(packageJson.n8n.nodes).toEqual([
			'dist/nodes/LunchMoney/LunchMoney.node.js',
		]);
	});
});
