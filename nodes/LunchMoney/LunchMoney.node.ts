import type {
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

export class LunchMoney implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'LunchMoney',
		name: 'lunchMoney',
		icon: 'file:lunchmoney.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Use the LunchMoney V2 API',
		defaults: {
			name: 'LunchMoney',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'lunchMoneyApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: '={{$credentials.baseUrl}}',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'User',
						value: 'user',
					},
				],
				default: 'user',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['user'],
					},
				},
				options: [
					{
						name: 'Get Current User',
						value: 'getCurrent',
						action: 'Get current LunchMoney user',
						routing: {
							request: {
								method: 'GET',
								url: '/me',
							},
						},
					},
				],
				default: 'getCurrent',
			},
		],
	};
}
