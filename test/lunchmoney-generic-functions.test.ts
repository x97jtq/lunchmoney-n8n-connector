import type { IHttpRequestOptions, INode } from 'n8n-workflow';

import {
	lunchMoneyApiRequest,
	lunchMoneyApiRequestAllItems,
	normalizeLunchMoneyApiError,
	redactSensitiveRequestData,
	type LunchMoneyRequestContext,
} from '../nodes/LunchMoney/GenericFunctions';
import {
	fakeBaseUrl,
	fakeLunchMoneyApiKey,
	fakeNode,
	fakeTransactionBody,
} from './fixtures/lunchmoney';

function createContext(responses: unknown[] = []): LunchMoneyRequestContext {
	const httpRequestWithAuthentication = jest.fn();

	for (const response of responses) {
		httpRequestWithAuthentication.mockResolvedValueOnce(response);
	}

	return {
		getCredentials: jest.fn().mockResolvedValue({
			baseUrl: `${fakeBaseUrl}/`,
		}),
		getNode: jest.fn().mockReturnValue({
			...fakeNode,
		} as INode),
		helpers: {
			httpRequestWithAuthentication,
		},
	} as unknown as LunchMoneyRequestContext;
}

describe('LunchMoney generic functions', () => {
	it('sends requests through n8n credential helpers', async () => {
		const context = createContext([{ id: 1 }]);

		const response = await lunchMoneyApiRequest.call(context, {
			method: 'GET',
			url: '/me',
		});

		expect(response).toEqual({ id: 1 });
		expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
			'lunchMoneyApi',
			expect.objectContaining({
				method: 'GET',
				url: '/me',
				baseURL: fakeBaseUrl,
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
				json: true,
			}),
		);
		expect(context.getCredentials).toHaveBeenCalledWith('lunchMoneyApi');
	});

	it('delegates bearer auth to n8n credential helpers without adding raw auth headers', async () => {
		const context = createContext([{ id: 1 }]);

		await lunchMoneyApiRequest.call(context, {
			method: 'GET',
			url: '/me',
		});

		const [credentialName, requestOptions] = (
			context.helpers.httpRequestWithAuthentication as jest.Mock
		).mock.calls[0] as [string, IHttpRequestOptions];

		expect(credentialName).toBe('lunchMoneyApi');
		expect(requestOptions.headers).toEqual({
			Accept: 'application/json',
			'Content-Type': 'application/json',
		});
		expect(JSON.stringify(requestOptions)).not.toContain(fakeLunchMoneyApiKey);
		expect(JSON.stringify(requestOptions.headers)).not.toContain('Authorization');
	});

	it('paginates offset endpoints using has_more', async () => {
		const context = createContext([
			{
				transactions: [{ id: 1 }, { id: 2 }],
				has_more: true,
			},
			{
				transactions: [{ id: 3 }],
				has_more: false,
			},
		]);

		const transactions = await lunchMoneyApiRequestAllItems.call(context, {
			method: 'GET',
			url: '/transactions',
			responseKey: 'transactions',
			limit: 2,
		});

		expect(transactions).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
		expect(context.helpers.httpRequestWithAuthentication).toHaveBeenNthCalledWith(
			1,
			'lunchMoneyApi',
			expect.objectContaining({
				qs: {
					limit: 2,
					offset: 0,
				},
			}),
		);
		expect(context.helpers.httpRequestWithAuthentication).toHaveBeenNthCalledWith(
			2,
			'lunchMoneyApi',
			expect.objectContaining({
				qs: {
					limit: 2,
					offset: 2,
				},
			}),
		);
	});

	it('redacts authorization headers and omits request bodies from normalized request data', () => {
		const redacted = redactSensitiveRequestData({
			method: 'POST',
			url: '/transactions',
			baseURL: 'https://api.lunchmoney.dev/v2',
			headers: {
				Authorization: `Bearer ${fakeLunchMoneyApiKey}`,
			},
			body: fakeTransactionBody,
		});

		expect(redacted).toEqual({
			method: 'POST',
			url: '/transactions',
			baseURL: 'https://api.lunchmoney.dev/v2',
			headers: {
				Authorization: '[REDACTED]',
			},
		});
	});

	it('normalizes API errors without leaking authorization or request body data', () => {
		const context = createContext();
		const error = normalizeLunchMoneyApiError.call(
			context,
			Object.assign(new Error('Unauthorized'), {
				statusCode: 401,
				options: {
					headers: {
						Authorization: `Bearer ${fakeLunchMoneyApiKey}`,
					},
				},
			}),
			{
				method: 'POST',
				url: '/transactions',
				body: fakeTransactionBody,
			} as IHttpRequestOptions,
		);

		const serialized = JSON.stringify(error);
		const description = error.description ?? '';

		expect(description).toContain('[REDACTED]');
		expect(description).not.toContain(fakeLunchMoneyApiKey);
		expect(description).not.toContain('Mock Coffee');
		expect(serialized).not.toContain(fakeLunchMoneyApiKey);
		expect(serialized).not.toContain('Mock Coffee');
	});

	it('redacts lowercase authorization headers from normalized errors', () => {
		const context = createContext();
		const error = normalizeLunchMoneyApiError.call(
			context,
			Object.assign(new Error('Forbidden'), {
				response: {
					statusCode: 403,
					statusMessage: 'Forbidden',
				},
				options: {
					headers: {
						authorization: `Bearer ${fakeLunchMoneyApiKey}`,
					},
				},
			}),
			{
				method: 'GET',
				url: '/transactions',
			} as IHttpRequestOptions,
		);

		const description = error.description ?? '';

		expect(description).toContain('"authorization":"[REDACTED]"');
		expect(description).not.toContain(fakeLunchMoneyApiKey);
		expect(error.httpCode).toBe('403');
	});
});
