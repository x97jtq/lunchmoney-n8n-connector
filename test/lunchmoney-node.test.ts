import type { IDataObject, IExecuteFunctions, INode } from 'n8n-workflow';

import { LunchMoney } from '../nodes/LunchMoney/LunchMoney.node';
import {
	lunchMoneyApiRequest,
	lunchMoneyApiRequestAllItems,
} from '../nodes/LunchMoney/GenericFunctions';
import {
	fakeAttachmentBinaryData,
	fakeAttachmentBinaryPropertyName,
	fakeAttachmentBuffer,
	fakeAttachmentNotes,
	fakeAttachmentResponse,
	fakeBudgetSettingsResponse,
	fakeBudgetWriteBody,
	fakeCategoryWriteBody,
	fakeCategoryResponse,
	fakeDeleteResponse,
	fakeManualAccountResponse,
	fakeManualAccountWriteBody,
	fakeNode,
	fakePaginatedTransactions,
	fakePlaidAccountResponse,
	fakeRecurringItemResponse,
	fakeSummaryResponse,
	fakeTagResponse,
	fakeTagWriteBody,
	fakeTransactionDateFilteredResponse,
	fakeTransactionGroupBody,
	fakeTransactionGroupResponse,
	fakeTransactionResponse,
	fakeTransactionSplitBody,
	fakeTransactionSplitResponse,
	fakeTransactionsUpdateBody,
	fakeTransactionsWriteBody,
} from './fixtures/lunchmoney';

jest.mock('../nodes/LunchMoney/GenericFunctions', () => ({
	lunchMoneyApiRequest: jest.fn(),
	lunchMoneyApiRequestAllItems: jest.fn(),
}));

const mockedLunchMoneyApiRequest = jest.mocked(lunchMoneyApiRequest);
const mockedLunchMoneyApiRequestAllItems = jest.mocked(lunchMoneyApiRequestAllItems);

function createExecuteContext(
	parameters: Record<string, unknown>,
): IExecuteFunctions {
	return {
		getNode: jest.fn().mockReturnValue({
			...fakeNode,
		} as INode),
		getNodeParameter: jest.fn((name: string) => parameters[name]),
		helpers: {
			returnJsonArray: jest.fn((data: IDataObject | IDataObject[]) => {
				const items = Array.isArray(data) ? data : [data];

				return items.map((json) => ({ json }));
			}),
			assertBinaryData: jest.fn().mockReturnValue({
				...fakeAttachmentBinaryData,
			}),
			getBinaryDataBuffer: jest.fn().mockResolvedValue(fakeAttachmentBuffer),
		},
	} as unknown as IExecuteFunctions;
}

describe('LunchMoney node', () => {
	beforeEach(() => {
		mockedLunchMoneyApiRequest.mockReset();
		mockedLunchMoneyApiRequestAllItems.mockReset();
	});

	it('defines read-only Sprint 5 resources and operations', () => {
		const node = new LunchMoney();
		const resource = node.description.properties.find((property) => property.name === 'resource');

		expect(resource?.options).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ name: 'Category', value: 'category' }),
				expect.objectContaining({ name: 'Custom API Call', value: 'customApiCall' }),
				expect.objectContaining({ name: 'Tag', value: 'tag' }),
				expect.objectContaining({ name: 'Manual Account', value: 'manualAccount' }),
				expect.objectContaining({ name: 'Plaid Account', value: 'plaidAccount' }),
				expect.objectContaining({ name: 'Recurring Item', value: 'recurringItem' }),
				expect.objectContaining({ name: 'Budget', value: 'budget' }),
				expect.objectContaining({ name: 'Summary', value: 'summary' }),
				expect.objectContaining({ name: 'Transaction', value: 'transaction' }),
			]),
		);

		for (const resourceName of ['category', 'tag', 'manualAccount', 'plaidAccount', 'recurringItem']) {
			const operation = node.description.properties.find(
				(property) =>
					property.name === 'operation' &&
					property.displayOptions?.show?.resource?.includes(resourceName),
			);

			expect(operation?.options).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ name: 'Get Many', value: 'getAll' }),
					expect.objectContaining({ name: 'Get', value: 'get' }),
				]),
			);
		}

		const transactionOperation = node.description.properties.find(
			(property) =>
				property.name === 'operation' &&
				property.displayOptions?.show?.resource?.includes('transaction'),
		);

		expect(transactionOperation?.options).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ name: 'Get Many', value: 'getAll' }),
				expect.objectContaining({ name: 'Get', value: 'get' }),
			]),
		);

		expect(node.description.properties).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					name: 'returnAll',
					displayOptions: expect.objectContaining({
						show: expect.objectContaining({
							operation: ['getAll'],
						}),
					}),
				}),
				expect.objectContaining({
					name: 'limit',
					default: 50,
					displayOptions: expect.objectContaining({
						show: expect.objectContaining({
							operation: ['getAll'],
							returnAll: [false],
						}),
					}),
				}),
			]),
		);
	});

	it('defines Custom API Call controls', () => {
		const node = new LunchMoney();

		expect(node.description.properties).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					name: 'customMethod',
					default: 'GET',
					options: expect.arrayContaining([
						expect.objectContaining({ value: 'GET' }),
						expect.objectContaining({ value: 'POST' }),
						expect.objectContaining({ value: 'DELETE' }),
					]),
				}),
				expect.objectContaining({
					name: 'endpointPath',
					default: '/',
				}),
				expect.objectContaining({
					name: 'queryParameters',
					type: 'fixedCollection',
				}),
				expect.objectContaining({
					name: 'customBody',
					type: 'json',
				}),
				expect.objectContaining({
					name: 'confirmCustomApiCallWrite',
					default: false,
				}),
			]),
		);
	});

	it('runs Custom API Call through LunchMoney request helper', async () => {
		mockedLunchMoneyApiRequest.mockResolvedValueOnce({ ok: true });

		const context = createExecuteContext({
			resource: 'customApiCall',
			operation: 'customApiCall',
			customMethod: 'POST',
			endpointPath: '/mock_endpoint',
			confirmCustomApiCallWrite: true,
			queryParameters: {
				parameters: [
					{ name: 'include_mock', value: 'true' },
					{ name: '', value: 'ignored' },
				],
			},
			customBody: {
				mock: true,
			},
		});
		const node = new LunchMoney();

		const result = await node.execute.call(context);

		expect(mockedLunchMoneyApiRequest).toHaveBeenCalledWith({
			method: 'POST',
			url: '/mock_endpoint',
			qs: {
				include_mock: 'true',
			},
			body: {
				mock: true,
			},
		});
		expect(result).toEqual([[{ json: { ok: true } }]]);
	});

	it.each(['POST', 'PUT', 'PATCH', 'DELETE'])(
		'blocks Custom API Call %s without custom write confirmation',
		async (customMethod) => {
			const context = createExecuteContext({
				resource: 'customApiCall',
				operation: 'customApiCall',
				customMethod,
				endpointPath: '/transactions',
				confirmCustomApiCallWrite: false,
				queryParameters: {},
				customBody: {},
			});
			const node = new LunchMoney();

			await expect(node.execute.call(context)).rejects.toThrow(
				'Confirm Custom Write Operation must be enabled.',
			);
			expect(mockedLunchMoneyApiRequest).not.toHaveBeenCalled();
		},
	);

	it.each([
		['/me'],
		['/transactions'],
		['/transactions/123/attachments'],
	])('allows safe Custom API Call endpoint path %s', async (endpointPath) => {
		mockedLunchMoneyApiRequest.mockResolvedValueOnce({ ok: true });

		const context = createExecuteContext({
			resource: 'customApiCall',
			operation: 'customApiCall',
			customMethod: 'GET',
			endpointPath,
			queryParameters: {},
			customBody: {},
		});
		const node = new LunchMoney();

		await node.execute.call(context);

		expect(mockedLunchMoneyApiRequest).toHaveBeenCalledWith({
			method: 'GET',
			url: endpointPath,
			qs: {},
			body: undefined,
		});
	});

	it.each([
		['//api.evil.invalid/v2/me'],
		['me'],
		['transactions'],
	])('blocks unsafe Custom API Call endpoint path %s', async (endpointPath) => {
		const context = createExecuteContext({
			resource: 'customApiCall',
			operation: 'customApiCall',
			customMethod: 'GET',
			endpointPath,
			queryParameters: {},
			customBody: {},
		});
		const node = new LunchMoney();

		await expect(node.execute.call(context)).rejects.toThrow('Endpoint Path must start with a single /.');
		expect(mockedLunchMoneyApiRequest).not.toHaveBeenCalled();
	});

	it.each([
		['https://api.evil.invalid/v2/me'],
		['http://api.evil.invalid/v2/me'],
		['HTTPS://api.evil.invalid/v2/me'],
	])('rejects external Custom API Call URL %s', async (endpointPath) => {
		const context = createExecuteContext({
			resource: 'customApiCall',
			operation: 'customApiCall',
			customMethod: 'GET',
			endpointPath,
			queryParameters: {},
			customBody: {},
		});
		const node = new LunchMoney();

		await expect(node.execute.call(context)).rejects.toThrow('Full external URLs are not allowed.');
		expect(mockedLunchMoneyApiRequest).not.toHaveBeenCalled();
	});

	it('defines supported transaction filters from the Postman contract', () => {
		const node = new LunchMoney();
		const filters = node.description.properties.find((property) => property.name === 'filters');

		expect(filters).toMatchObject({
			displayName: 'Filters',
			name: 'filters',
			type: 'collection',
			displayOptions: {
				show: {
					resource: ['transaction'],
					operation: ['getAll'],
				},
			},
		});
		expect(filters?.options).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ name: 'start_date' }),
				expect.objectContaining({ name: 'end_date' }),
				expect.objectContaining({ name: 'created_since' }),
				expect.objectContaining({ name: 'updated_since' }),
				expect.objectContaining({ name: 'manual_account_id' }),
				expect.objectContaining({ name: 'plaid_account_id' }),
				expect.objectContaining({ name: 'recurring_id' }),
				expect.objectContaining({ name: 'category_id' }),
				expect.objectContaining({ name: 'tag_id' }),
				expect.objectContaining({ name: 'is_group_parent' }),
				expect.objectContaining({ name: 'status' }),
				expect.objectContaining({ name: 'is_pending' }),
				expect.objectContaining({ name: 'include_pending' }),
				expect.objectContaining({ name: 'include_metadata' }),
				expect.objectContaining({ name: 'include_split_parents' }),
				expect.objectContaining({ name: 'include_group_children' }),
				expect.objectContaining({ name: 'include_children' }),
				expect.objectContaining({ name: 'include_files' }),
			]),
		);
	});

	it('runs User > Get current user through GET /me and returns n8n items', async () => {
		mockedLunchMoneyApiRequest.mockResolvedValueOnce({
			user_id: 1,
			user_name: 'Mock User',
			user_email: 'mock@example.invalid',
		});

		const context = createExecuteContext({
			resource: 'user',
			operation: 'getCurrent',
		});
		const node = new LunchMoney();

		const result = await node.execute.call(context);

		expect(mockedLunchMoneyApiRequest).toHaveBeenCalledWith({
			method: 'GET',
			url: '/me',
		});
		expect(context.helpers.returnJsonArray).toHaveBeenCalledWith({
			user_id: 1,
			user_name: 'Mock User',
			user_email: 'mock@example.invalid',
		});
		expect(result).toEqual([
			[
				{
					json: {
						user_id: 1,
						user_name: 'Mock User',
						user_email: 'mock@example.invalid',
					},
				},
			],
		]);
	});

	it.each([
		['category', '/categories', fakeCategoryResponse, [{ id: 101, name: 'Mock Groceries' }],
		],
		['tag', '/tags', fakeTagResponse, [{ id: 201, name: 'mock-review' }]],
		['manualAccount', '/manual_accounts', fakeManualAccountResponse, [
			{ id: 301, name: 'Mock Cash Wallet' },
		]],
		['plaidAccount', '/plaid_accounts', fakePlaidAccountResponse, [
			{ id: 401, name: 'Mock Plaid Checking' },
		]],
	])('runs %s > Get many with Limit', async (resource, url, response, expectedItems) => {
		mockedLunchMoneyApiRequest.mockResolvedValueOnce(response);

		const context = createExecuteContext({
			resource,
			operation: 'getAll',
			returnAll: false,
			limit: 1,
		});
		const node = new LunchMoney();

		const result = await node.execute.call(context);

		expect(mockedLunchMoneyApiRequest).toHaveBeenCalledWith({
			method: 'GET',
			url,
		});
		expect(context.helpers.returnJsonArray).toHaveBeenCalledWith(expectedItems);
		expect(result).toEqual([
			[
				{
					json: expectedItems[0],
				},
			],
		]);
	});

	it.each([
		['category', 'categoryId', '/categories/123'],
		['tag', 'tagId', '/tags/123'],
		['manualAccount', 'manualAccountId', '/manual_accounts/123'],
		['plaidAccount', 'plaidAccountId', '/plaid_accounts/123'],
		['recurringItem', 'recurringItemId', '/recurring_items/123'],
		['transaction', 'transactionId', '/transactions/123'],
	])('runs %s > Get', async (resource, idParameter, url) => {
		const fakeSingleResponse = { id: 123, name: 'Mock Record' };
		mockedLunchMoneyApiRequest.mockResolvedValueOnce(fakeSingleResponse);

		const context = createExecuteContext({
			resource,
			operation: 'get',
			[idParameter]: '123',
		});
		const node = new LunchMoney();

		const result = await node.execute.call(context);

		expect(mockedLunchMoneyApiRequest).toHaveBeenCalledWith({
			method: 'GET',
			url,
		});
		expect(result).toEqual([
			[
				{
					json: {
						...fakeSingleResponse,
					},
				},
			],
		]);
	});

	it('runs Transactions > Get many with date filters and Limit', async () => {
		mockedLunchMoneyApiRequest.mockResolvedValueOnce(fakeTransactionDateFilteredResponse);

		const context = createExecuteContext({
			resource: 'transaction',
			operation: 'getAll',
			returnAll: false,
			limit: 1,
			filters: {
				start_date: '2026-02-01',
				end_date: '2026-02-28',
				created_since: '2026-02-01T00:00:00Z',
				updated_since: '2026-02-15T00:00:00Z',
				manual_account_id: '',
				unsupported_filter: 'ignored',
			},
		});
		const node = new LunchMoney();

		const result = await node.execute.call(context);

		expect(mockedLunchMoneyApiRequest).toHaveBeenCalledWith({
			method: 'GET',
			url: '/transactions',
			qs: {
				start_date: '2026-02-01',
				end_date: '2026-02-28',
				created_since: '2026-02-01T00:00:00Z',
				updated_since: '2026-02-15T00:00:00Z',
				limit: 1,
				offset: 0,
			},
		});
		expect(result).toEqual([
			[
				{
					json: {
						id: 1101,
						payee: 'Mock Date Filter One',
						amount: '11.00',
						date: '2026-02-03',
					},
				},
			],
		]);
	});

	it('runs Transactions > Get many with Return All through pagination helper', async () => {
		mockedLunchMoneyApiRequestAllItems.mockResolvedValueOnce(fakePaginatedTransactions);

		const context = createExecuteContext({
			resource: 'transaction',
			operation: 'getAll',
			returnAll: true,
			filters: {
				updated_since: '2026-01-01T00:00:00Z',
				manual_account_id: '301',
			},
		});
		const node = new LunchMoney();

		const result = await node.execute.call(context);

		expect(mockedLunchMoneyApiRequestAllItems).toHaveBeenCalledWith({
			method: 'GET',
			url: '/transactions',
			responseKey: 'transactions',
			qs: {
				updated_since: '2026-01-01T00:00:00Z',
				manual_account_id: '301',
			},
		});
		expect(mockedLunchMoneyApiRequest).not.toHaveBeenCalled();
		expect(result).toEqual([
			[
				{
					json: {
						id: 1201,
						payee: 'Mock Page Transaction One',
						amount: '12.01',
						date: '2026-03-01',
					},
				},
				{
					json: {
						id: 1202,
						payee: 'Mock Page Transaction Two',
						amount: '12.02',
						date: '2026-03-02',
					},
				},
			],
		]);
	});

	it('returns one n8n item per transaction', async () => {
		mockedLunchMoneyApiRequest.mockResolvedValueOnce(fakeTransactionResponse);

		const context = createExecuteContext({
			resource: 'transaction',
			operation: 'getAll',
			returnAll: false,
			limit: 2,
			filters: {},
		});
		const node = new LunchMoney();

		const result = await node.execute.call(context);

		expect(context.helpers.returnJsonArray).toHaveBeenCalledWith(fakeTransactionResponse.transactions);
		expect(result[0]).toHaveLength(2);
		expect(result).toEqual([
			[
				{
					json: fakeTransactionResponse.transactions[0],
				},
				{
					json: fakeTransactionResponse.transactions[1],
				},
			],
		]);
	});

	it('runs Recurring Items > Get many against the documented nested envelope', async () => {
		mockedLunchMoneyApiRequest.mockResolvedValueOnce(fakeRecurringItemResponse);

		const context = createExecuteContext({
			resource: 'recurringItem',
			operation: 'getAll',
			returnAll: true,
		});
		const node = new LunchMoney();

		const result = await node.execute.call(context);

		expect(mockedLunchMoneyApiRequest).toHaveBeenCalledWith({
			method: 'GET',
			url: '/recurring_items',
		});
		expect(result).toEqual([
			[
				{
					json: { id: 501, payee: 'Mock Subscription' },
				},
				{
					json: { id: 502, payee: 'Mock Membership' },
				},
			],
		]);
	});

	it.each([
		['budget', 'getSettings', '/budgets/settings', fakeBudgetSettingsResponse],
		['summary', 'get', '/summary', fakeSummaryResponse],
	])('runs %s operation', async (resource, operation, url, response) => {
		mockedLunchMoneyApiRequest.mockResolvedValueOnce(response);

		const context = createExecuteContext({
			resource,
			operation,
		});
		const node = new LunchMoney();

		const result = await node.execute.call(context);

		expect(mockedLunchMoneyApiRequest).toHaveBeenCalledWith({
			method: 'GET',
			url,
		});
		expect(result).toEqual([
			[
				{
					json: response,
				},
			],
		]);
	});

	it.each([
		['category', 'create', '/categories', 'POST', 'categoryFields', fakeCategoryWriteBody],
		['category', 'update', '/categories/123', 'PUT', 'categoryFields', fakeCategoryWriteBody],
		['tag', 'create', '/tags', 'POST', 'tagFields', fakeTagWriteBody],
		['tag', 'update', '/tags/123', 'PUT', 'tagFields', fakeTagWriteBody],
		[
			'manualAccount',
			'create',
			'/manual_accounts',
			'POST',
			'manualAccountFields',
			fakeManualAccountWriteBody,
		],
		[
			'manualAccount',
			'update',
			'/manual_accounts/123',
			'PUT',
			'manualAccountFields',
			fakeManualAccountWriteBody,
		],
		['budget', 'upsert', '/budgets', 'PUT', 'budgetFields', fakeBudgetWriteBody],
	])('runs %s > %s with request body', async (
		resource,
		operation,
		url,
		method,
		bodyParameter,
		body,
	) => {
		mockedLunchMoneyApiRequest.mockResolvedValueOnce({ id: 123 });

		const context = createExecuteContext({
			resource,
			operation,
			categoryId: '123',
			tagId: '123',
			manualAccountId: '123',
			[bodyParameter]: body,
		});
		const node = new LunchMoney();

		await node.execute.call(context);

		expect(mockedLunchMoneyApiRequest).toHaveBeenCalledWith({
			method,
			url,
			body,
		});
	});

	it('runs Plaid Accounts > Trigger fetch with query options', async () => {
		mockedLunchMoneyApiRequest.mockResolvedValueOnce({ accepted: true });

		const context = createExecuteContext({
			resource: 'plaidAccount',
			operation: 'fetch',
			fetchOptions: {
				id: '401',
				start_date: '2026-01-01',
				end_date: '2026-01-31',
			},
		});
		const node = new LunchMoney();

		await node.execute.call(context);

		expect(mockedLunchMoneyApiRequest).toHaveBeenCalledWith({
			method: 'POST',
			url: '/plaid_accounts/fetch',
			qs: {
				id: '401',
				start_date: '2026-01-01',
				end_date: '2026-01-31',
			},
		});
	});

	it('runs Transactions > Insert one or more with guarded body', async () => {
		mockedLunchMoneyApiRequest.mockResolvedValueOnce(fakeTransactionResponse);

		const context = createExecuteContext({
			resource: 'transaction',
			operation: 'insert',
			transactions: fakeTransactionsWriteBody,
		});
		const node = new LunchMoney();

		await node.execute.call(context);

		expect(mockedLunchMoneyApiRequest).toHaveBeenCalledWith({
			method: 'POST',
			url: '/transactions',
			body: {
				transactions: fakeTransactionsWriteBody,
			},
		});
	});

	it('runs Transactions > Update with request body and update balance flag', async () => {
		mockedLunchMoneyApiRequest.mockResolvedValueOnce({ id: 1001 });

		const context = createExecuteContext({
			resource: 'transaction',
			operation: 'update',
			transactionId: '1001',
			transactionFields: {
				category_id: 102,
			},
			updateBalance: true,
		});
		const node = new LunchMoney();

		await node.execute.call(context);

		expect(mockedLunchMoneyApiRequest).toHaveBeenCalledWith({
			method: 'PUT',
			url: '/transactions/1001',
			qs: {
				update_balance: true,
			},
			body: {
				category_id: 102,
			},
		});
	});

	it('runs Transactions > Update many with duplicate ID guard', async () => {
		mockedLunchMoneyApiRequest.mockResolvedValueOnce({ transactions: fakeTransactionsUpdateBody });

		const context = createExecuteContext({
			resource: 'transaction',
			operation: 'updateAll',
			transactions: fakeTransactionsUpdateBody,
		});
		const node = new LunchMoney();

		await node.execute.call(context);

		expect(mockedLunchMoneyApiRequest).toHaveBeenCalledWith({
			method: 'PUT',
			url: '/transactions',
			body: {
				transactions: fakeTransactionsUpdateBody,
			},
		});
	});

	it.each([
		['category', 'create', 'categoryFields', {}, 'name is required.'],
		['category', 'update', 'categoryFields', {}, 'Category Fields must contain at least one field.'],
		['manualAccount', 'create', 'manualAccountFields', { name: 'Mock' }, 'type is required.'],
		[
			'manualAccount',
			'update',
			'manualAccountFields',
			{},
			'Manual Account Fields must contain at least one field.',
		],
		['tag', 'create', 'tagFields', {}, 'name is required.'],
		['tag', 'update', 'tagFields', {}, 'Tag Fields must contain at least one field.'],
		['budget', 'upsert', 'budgetFields', { start_date: '2026-01-01' }, 'category_id is required.'],
		['transaction', 'insert', 'transactions', [], 'Transactions must contain at least one item.'],
		['transaction', 'update', 'transactionFields', {}, 'Transaction Fields must contain at least one field.'],
	])('rejects invalid input for %s > %s', async (
		resource,
		operation,
		bodyParameter,
		body,
		message,
	) => {
		const context = createExecuteContext({
			resource,
			operation,
			transactionId: '1001',
			[bodyParameter]: body,
		});
		const node = new LunchMoney();

		await expect(node.execute.call(context)).rejects.toThrow(message);
		expect(mockedLunchMoneyApiRequest).not.toHaveBeenCalled();
	});

	it('rejects duplicate transaction IDs for Transactions > Update many', async () => {
		const context = createExecuteContext({
			resource: 'transaction',
			operation: 'updateAll',
			transactions: [
				{ id: 1001, category_id: 101 },
				{ id: 1001, category_id: 102 },
			],
		});
		const node = new LunchMoney();

		await expect(node.execute.call(context)).rejects.toThrow('Duplicate transaction id: 1001.');
		expect(mockedLunchMoneyApiRequest).not.toHaveBeenCalled();
	});

	it('rejects transaction update-many rows without update fields', async () => {
		const context = createExecuteContext({
			resource: 'transaction',
			operation: 'updateAll',
			transactions: [
				{ id: 1001 },
			],
		});
		const node = new LunchMoney();

		await expect(node.execute.call(context)).rejects.toThrow(
			'Each transaction must include at least one update field.',
		);
		expect(mockedLunchMoneyApiRequest).not.toHaveBeenCalled();
	});

	it('rejects transaction bulk writes above conservative limit', async () => {
		const context = createExecuteContext({
			resource: 'transaction',
			operation: 'insert',
			transactions: Array.from({ length: 101 }, (_, index) => ({
				date: '2026-01-15',
				amount: '1.00',
				payee: `Mock Payee ${index}`,
			})),
		});
		const node = new LunchMoney();

		await expect(node.execute.call(context)).rejects.toThrow('Transactions cannot exceed 100 items.');
		expect(mockedLunchMoneyApiRequest).not.toHaveBeenCalled();
	});

		it('defines reusable destructive confirmation fields', () => {
			const node = new LunchMoney();
			const destructiveConfirmationFields = node.description.properties.filter(
				(property) => property.name === 'confirmDestructiveOperation',
			);

			expect(destructiveConfirmationFields).toEqual([
				expect.objectContaining({
					displayName: 'Confirm Destructive Operation',
					default: false,
					required: true,
					displayOptions: { show: { resource: ['category'], operation: ['delete'] } },
				}),
				expect.objectContaining({
					displayName: 'Confirm Destructive Operation',
					default: false,
					required: true,
					displayOptions: { show: { resource: ['manualAccount'], operation: ['delete'] } },
				}),
				expect.objectContaining({
					displayName: 'Confirm Destructive Operation',
					default: false,
					required: true,
					displayOptions: { show: { resource: ['tag'], operation: ['delete'] } },
				}),
				expect.objectContaining({
					displayName: 'Confirm Destructive Operation',
					default: false,
					required: true,
					displayOptions: { show: { resource: ['budget'], operation: ['delete'] } },
				}),
				expect.objectContaining({
					displayName: 'Confirm Destructive Operation',
					default: false,
					required: true,
					displayOptions: {
						show: {
							resource: ['transaction'],
							operation: ['delete', 'deleteAll', 'deleteGroup', 'unsplit', 'deleteAttachment'],
						},
					},
				}),
			]);
		});

	it.each([
		['category', 'categoryId', '/categories/123'],
		['manualAccount', 'manualAccountId', '/manual_accounts/123'],
		['tag', 'tagId', '/tags/123'],
		['transaction', 'transactionId', '/transactions/123'],
	])('runs %s > Delete only when confirmed', async (resource, idParameter, url) => {
		mockedLunchMoneyApiRequest.mockResolvedValueOnce({ success: true });

		const context = createExecuteContext({
			resource,
			operation: 'delete',
			[idParameter]: '123',
			confirmDestructiveOperation: true,
		});
		const node = new LunchMoney();

		await node.execute.call(context);

		expect(mockedLunchMoneyApiRequest).toHaveBeenCalledWith({
			method: 'DELETE',
			url,
		});
	});

	it('runs Budgets > Delete only when confirmed', async () => {
		mockedLunchMoneyApiRequest.mockResolvedValueOnce({ success: true });

		const context = createExecuteContext({
			resource: 'budget',
			operation: 'delete',
			budgetDeleteFields: {
				category_id: 101,
				start_date: '2026-01-01',
			},
			confirmDestructiveOperation: true,
		});
		const node = new LunchMoney();

		await node.execute.call(context);

		expect(mockedLunchMoneyApiRequest).toHaveBeenCalledWith({
			method: 'DELETE',
			url: '/budgets',
			qs: {
				category_id: 101,
				start_date: '2026-01-01',
			},
		});
	});

	it('runs Transactions > Bulk Delete only when confirmed', async () => {
		mockedLunchMoneyApiRequest.mockResolvedValueOnce({ success: true });

		const context = createExecuteContext({
			resource: 'transaction',
			operation: 'deleteAll',
			transactionIds: [1001, 1002],
			confirmDestructiveOperation: true,
		});
		const node = new LunchMoney();

		await node.execute.call(context);

		expect(mockedLunchMoneyApiRequest).toHaveBeenCalledWith({
			method: 'DELETE',
			url: '/transactions',
			body: {
				ids: [1001, 1002],
			},
		});
	});

	it.each([
		['category', 'delete', { categoryId: '123' }],
		['manualAccount', 'delete', { manualAccountId: '123' }],
		['tag', 'delete', { tagId: '123' }],
		['budget', 'delete', { budgetDeleteFields: { category_id: 101, start_date: '2026-01-01' } }],
		['transaction', 'delete', { transactionId: '123' }],
		['transaction', 'deleteAll', { transactionIds: [1001] }],
	])('blocks %s > %s without destructive confirmation', async (resource, operation, extra) => {
		const context = createExecuteContext({
			resource,
			operation,
			...extra,
			confirmDestructiveOperation: false,
		});
		const node = new LunchMoney();

		await expect(node.execute.call(context)).rejects.toThrow(
			'Confirm Destructive Operation must be enabled.',
		);
		expect(mockedLunchMoneyApiRequest).not.toHaveBeenCalled();
	});

	it('rejects Budgets > Delete missing required query fields', async () => {
		const context = createExecuteContext({
			resource: 'budget',
			operation: 'delete',
			budgetDeleteFields: {
				category_id: 101,
			},
			confirmDestructiveOperation: true,
		});
		const node = new LunchMoney();

		await expect(node.execute.call(context)).rejects.toThrow('start_date is required.');
		expect(mockedLunchMoneyApiRequest).not.toHaveBeenCalled();
	});

	it.each([
		[[], 'Transaction IDs must contain at least one item.'],
		['not-json', 'Transaction IDs must be valid JSON array.'],
		['{}', 'Transaction IDs must be a JSON array.'],
		[[1001, 1001], 'Duplicate transaction id: 1001.'],
		[Array.from({ length: 101 }, (_, index) => index + 1), 'Transaction IDs cannot exceed 100 items.'],
	])('rejects invalid Transactions > Bulk Delete IDs', async (transactionIds, message) => {
		const context = createExecuteContext({
			resource: 'transaction',
			operation: 'deleteAll',
			transactionIds,
			confirmDestructiveOperation: true,
		});
		const node = new LunchMoney();

		await expect(node.execute.call(context)).rejects.toThrow(message);
		expect(mockedLunchMoneyApiRequest).not.toHaveBeenCalled();
	});

	it('runs Transactions > Create Group with contract body', async () => {
		mockedLunchMoneyApiRequest.mockResolvedValueOnce(fakeTransactionGroupResponse);

		const context = createExecuteContext({
			resource: 'transaction',
			operation: 'createGroup',
			transactionGroupFields: fakeTransactionGroupBody,
		});
		const node = new LunchMoney();

		const result = await node.execute.call(context);

		expect(mockedLunchMoneyApiRequest).toHaveBeenCalledWith({
			method: 'POST',
			url: '/transactions/group',
			body: fakeTransactionGroupBody,
		});
		expect(result).toEqual([[{ json: fakeTransactionGroupResponse }]]);
	});

	it('runs Transactions > Delete Group only when confirmed', async () => {
		mockedLunchMoneyApiRequest.mockResolvedValueOnce(fakeDeleteResponse);

		const context = createExecuteContext({
			resource: 'transaction',
			operation: 'deleteGroup',
			transactionId: '2001',
			confirmDestructiveOperation: true,
		});
		const node = new LunchMoney();

		const result = await node.execute.call(context);

		expect(mockedLunchMoneyApiRequest).toHaveBeenCalledWith({
			method: 'DELETE',
			url: '/transactions/group/2001',
		});
		expect(result).toEqual([[{ json: fakeDeleteResponse }]]);
	});

	it('runs Transactions > Split with contract body', async () => {
		mockedLunchMoneyApiRequest.mockResolvedValueOnce(fakeTransactionSplitResponse);

		const context = createExecuteContext({
			resource: 'transaction',
			operation: 'split',
			transactionId: '1001',
			transactionSplitFields: fakeTransactionSplitBody,
		});
		const node = new LunchMoney();

		const result = await node.execute.call(context);

		expect(mockedLunchMoneyApiRequest).toHaveBeenCalledWith({
			method: 'POST',
			url: '/transactions/split/1001',
			body: fakeTransactionSplitBody,
		});
		expect(result).toEqual([[{ json: fakeTransactionSplitResponse }]]);
	});

	it('runs Transactions > Unsplit only when confirmed', async () => {
		mockedLunchMoneyApiRequest.mockResolvedValueOnce(fakeDeleteResponse);

		const context = createExecuteContext({
			resource: 'transaction',
			operation: 'unsplit',
			transactionId: '1001',
			confirmDestructiveOperation: true,
		});
		const node = new LunchMoney();

		const result = await node.execute.call(context);

		expect(mockedLunchMoneyApiRequest).toHaveBeenCalledWith({
			method: 'DELETE',
			url: '/transactions/split/1001',
		});
		expect(result).toEqual([[{ json: fakeDeleteResponse }]]);
	});

	it.each([
		['createGroup', { transactionGroupFields: { payee: 'Mock', date: '2026-01-20' } }, 'ids is required.'],
		[
			'createGroup',
			{ transactionGroupFields: { ids: [], payee: 'Mock', date: '2026-01-20' } },
			'ids must contain at least one item.',
		],
		['split', { transactionId: '1001', transactionSplitFields: {} }, 'child_transactions is required.'],
		[
			'split',
			{ transactionId: '1001', transactionSplitFields: { child_transactions: [] } },
			'child_transactions must contain at least one item.',
		],
	])('rejects invalid Transactions > %s input', async (operation, extra, message) => {
		const context = createExecuteContext({
			resource: 'transaction',
			operation,
			...extra,
		});
		const node = new LunchMoney();

		await expect(node.execute.call(context)).rejects.toThrow(message);
		expect(mockedLunchMoneyApiRequest).not.toHaveBeenCalled();
	});

	it.each([
		['deleteGroup', { transactionId: '2001' }],
		['unsplit', { transactionId: '1001' }],
	])('blocks Transactions > %s without destructive confirmation', async (operation, extra) => {
		const context = createExecuteContext({
			resource: 'transaction',
			operation,
			...extra,
			confirmDestructiveOperation: false,
		});
		const node = new LunchMoney();

		await expect(node.execute.call(context)).rejects.toThrow(
			'Confirm Destructive Operation must be enabled.',
		);
		expect(mockedLunchMoneyApiRequest).not.toHaveBeenCalled();
	});

	it('runs Transactions > Attach File with n8n binary data', async () => {
		mockedLunchMoneyApiRequest.mockResolvedValueOnce(fakeAttachmentResponse);

		const context = createExecuteContext({
			resource: 'transaction',
			operation: 'attachFile',
			transactionId: '1001',
			binaryPropertyName: fakeAttachmentBinaryPropertyName,
			attachmentNotes: fakeAttachmentNotes,
		});
		const node = new LunchMoney();

		await node.execute.call(context);

		expect(context.helpers.assertBinaryData).toHaveBeenCalledWith(0, fakeAttachmentBinaryPropertyName);
		expect(context.helpers.getBinaryDataBuffer).toHaveBeenCalledWith(0, fakeAttachmentBinaryPropertyName);
		expect(mockedLunchMoneyApiRequest).toHaveBeenCalledWith({
			method: 'POST',
			url: '/transactions/1001/attachments',
			formData: {
				file: {
					value: fakeAttachmentBuffer,
					options: {
						filename: fakeAttachmentBinaryData.fileName,
						contentType: fakeAttachmentBinaryData.mimeType,
					},
				},
				notes: fakeAttachmentNotes,
			},
		});
	});

	it('rejects Transactions > Attach File when binary property is missing', async () => {
		const context = createExecuteContext({
			resource: 'transaction',
			operation: 'attachFile',
			transactionId: '1001',
			binaryPropertyName: fakeAttachmentBinaryPropertyName,
			attachmentNotes: fakeAttachmentNotes,
		});
		const node = new LunchMoney();
		const binaryError = new Error('No binary data found for receipt.');

		jest.mocked(context.helpers.assertBinaryData).mockImplementationOnce(() => {
			throw binaryError;
		});

		await expect(node.execute.call(context)).rejects.toThrow(binaryError);
		expect(context.helpers.getBinaryDataBuffer).not.toHaveBeenCalled();
		expect(mockedLunchMoneyApiRequest).not.toHaveBeenCalled();
	});

	it('rejects Transactions > Attach File when binary buffer cannot be read', async () => {
		const context = createExecuteContext({
			resource: 'transaction',
			operation: 'attachFile',
			transactionId: '1001',
			binaryPropertyName: fakeAttachmentBinaryPropertyName,
			attachmentNotes: fakeAttachmentNotes,
		});
		const node = new LunchMoney();
		const bufferError = new Error('Synthetic binary buffer read failed.');

		jest.mocked(context.helpers.getBinaryDataBuffer).mockRejectedValueOnce(bufferError);

		await expect(node.execute.call(context)).rejects.toThrow(bufferError);
		expect(context.helpers.assertBinaryData).toHaveBeenCalledWith(0, fakeAttachmentBinaryPropertyName);
		expect(mockedLunchMoneyApiRequest).not.toHaveBeenCalled();
	});

	it('rejects Transactions > Attach File when binary buffer is too large', async () => {
		const context = createExecuteContext({
			resource: 'transaction',
			operation: 'attachFile',
			transactionId: '1001',
			binaryPropertyName: fakeAttachmentBinaryPropertyName,
			attachmentNotes: fakeAttachmentNotes,
		});
		const node = new LunchMoney();

		jest.mocked(context.helpers.getBinaryDataBuffer).mockResolvedValueOnce(
			Buffer.alloc(10 * 1024 * 1024),
		);

		await expect(node.execute.call(context)).rejects.toThrow(
			'Attachment file must be less than 10 MB.',
		);
		expect(context.helpers.assertBinaryData).toHaveBeenCalledWith(0, fakeAttachmentBinaryPropertyName);
		expect(mockedLunchMoneyApiRequest).not.toHaveBeenCalled();
	});

	it('runs Transactions > Get Attachment URL', async () => {
		const response = {
			url: 'https://signed.example.invalid/mock',
			expires_at: '2026-01-01T00:00:00Z',
		};
		mockedLunchMoneyApiRequest.mockResolvedValueOnce(response);

		const context = createExecuteContext({
			resource: 'transaction',
			operation: 'getAttachmentUrl',
			fileId: 'file_123',
		});
		const node = new LunchMoney();

		const result = await node.execute.call(context);

		expect(mockedLunchMoneyApiRequest).toHaveBeenCalledWith({
			method: 'GET',
			url: '/transactions/attachments/file_123',
		});
		expect(result).toEqual([[{ json: response }]]);
	});

	it('runs Transactions > Delete Attachment only when confirmed', async () => {
		mockedLunchMoneyApiRequest.mockResolvedValueOnce({ success: true });

		const context = createExecuteContext({
			resource: 'transaction',
			operation: 'deleteAttachment',
			fileId: 'file_123',
			confirmDestructiveOperation: true,
		});
		const node = new LunchMoney();

		await node.execute.call(context);

		expect(mockedLunchMoneyApiRequest).toHaveBeenCalledWith({
			method: 'DELETE',
			url: '/transactions/attachments/file_123',
		});
	});

	it('blocks Transactions > Delete Attachment without destructive confirmation', async () => {
		const context = createExecuteContext({
			resource: 'transaction',
			operation: 'deleteAttachment',
			fileId: 'file_123',
			confirmDestructiveOperation: false,
		});
		const node = new LunchMoney();

		await expect(node.execute.call(context)).rejects.toThrow(
			'Confirm Destructive Operation must be enabled.',
		);
		expect(mockedLunchMoneyApiRequest).not.toHaveBeenCalled();
	});
});
