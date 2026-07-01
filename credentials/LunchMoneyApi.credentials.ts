import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class LunchMoneyApi implements ICredentialType {
	name = 'lunchMoneyApi';

	displayName = 'LunchMoney API';

	documentationUrl = 'https://lunchmoney.dev/';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'LunchMoney bearer token. Use mock or test-budget tokens during development.',
		},
		{
			displayName: 'Base URL (Advanced)',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.lunchmoney.dev/v2',
			required: true,
			description: 'Advanced: override only for mock or dedicated test environments.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/me',
			method: 'GET',
		},
	};
}
