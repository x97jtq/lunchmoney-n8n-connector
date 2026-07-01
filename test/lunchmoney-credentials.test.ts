import { LunchMoneyApi } from '../credentials/LunchMoneyApi.credentials';
import { fakeLunchMoneyApiKey } from './fixtures/lunchmoney';

describe('LunchMoneyApi credentials', () => {
	const credentials = new LunchMoneyApi();

	it('uses the expected n8n credential identity', () => {
		expect(credentials.name).toBe('lunchMoneyApi');
		expect(credentials.displayName).toBe('LunchMoney API');
		expect(credentials.documentationUrl).toBe('https://lunchmoney.dev/');
	});

	it('defines a required secret API key field', () => {
		const apiKey = credentials.properties.find((property) => property.name === 'apiKey');

		expect(apiKey).toMatchObject({
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			required: true,
			typeOptions: {
				password: true,
			},
			default: '',
		});
		expect(apiKey?.description).toContain('mock or test-budget tokens');
	});

	it('defines an advanced base URL with the production default', () => {
		const baseUrl = credentials.properties.find((property) => property.name === 'baseUrl');

		expect(baseUrl).toMatchObject({
			displayName: 'Base URL (Advanced)',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.lunchmoney.dev/v2',
			required: true,
		});
		expect(baseUrl?.description).toContain('mock or dedicated test environments');
	});

	it('uses n8n generic bearer authentication', () => {
		expect(credentials.authenticate).toEqual({
			type: 'generic',
			properties: {
				headers: {
					Authorization: '=Bearer {{$credentials.apiKey}}',
				},
			},
		});
		expect(JSON.stringify(credentials.authenticate)).not.toContain(fakeLunchMoneyApiKey);
	});

	it('tests credentials with GET /me', () => {
		expect(credentials.test).toEqual({
			request: {
				baseURL: '={{$credentials.baseUrl}}',
				url: '/me',
				method: 'GET',
			},
		});
	});
});
