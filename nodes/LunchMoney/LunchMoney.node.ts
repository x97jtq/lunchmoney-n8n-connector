import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	INodeExecutionData,
	INodeProperties,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { lunchMoneyApiRequest, lunchMoneyApiRequestAllItems } from './GenericFunctions';

const MAX_ATTACHMENT_FILE_SIZE_BYTES = 10 * 1024 * 1024;

type ListOperation = {
	resource: string;
	operation: 'getAll';
	url: string;
	responseKey: string;
};

type SingleOperation = {
	resource: string;
	operation: 'get';
	url: (id: string) => string;
	idParameter: string;
};

const listOperations: ListOperation[] = [
	{
		resource: 'category',
		operation: 'getAll',
		url: '/categories',
		responseKey: 'categories',
	},
	{
		resource: 'tag',
		operation: 'getAll',
		url: '/tags',
		responseKey: 'tags',
	},
	{
		resource: 'manualAccount',
		operation: 'getAll',
		url: '/manual_accounts',
		responseKey: 'manual_accounts',
	},
	{
		resource: 'plaidAccount',
		operation: 'getAll',
		url: '/plaid_accounts',
		responseKey: 'plaid_accounts',
	},
	{
		resource: 'recurringItem',
		operation: 'getAll',
		url: '/recurring_items',
		responseKey: 'recurring_items',
	},
];

const singleOperations: SingleOperation[] = [
	{
		resource: 'category',
		operation: 'get',
		url: (id) => `/categories/${id}`,
		idParameter: 'categoryId',
	},
	{
		resource: 'tag',
		operation: 'get',
		url: (id) => `/tags/${id}`,
		idParameter: 'tagId',
	},
	{
		resource: 'manualAccount',
		operation: 'get',
		url: (id) => `/manual_accounts/${id}`,
		idParameter: 'manualAccountId',
	},
	{
		resource: 'plaidAccount',
		operation: 'get',
		url: (id) => `/plaid_accounts/${id}`,
		idParameter: 'plaidAccountId',
	},
	{
		resource: 'recurringItem',
		operation: 'get',
		url: (id) => `/recurring_items/${id}`,
		idParameter: 'recurringItemId',
	},
];

const listResources = listOperations.map(({ resource }) => resource);
const returnControlsResources = [...listResources, 'transaction'];
const transactionFilters = [
	'start_date',
	'end_date',
	'created_since',
	'updated_since',
	'manual_account_id',
	'plaid_account_id',
	'recurring_id',
	'category_id',
	'tag_id',
	'is_group_parent',
	'status',
	'is_pending',
	'include_pending',
	'include_metadata',
	'include_split_parents',
	'include_group_children',
	'include_children',
	'include_files',
];

function getListItems(response: IDataObject, responseKey: string): IDataObject[] {
	const value = response[responseKey];

	if (Array.isArray(value)) {
		return value as IDataObject[];
	}

	if (responseKey === 'recurring_items') {
		const nestedRecurringItems = (value as IDataObject | undefined)?.recurring_items;

		if (Array.isArray(nestedRecurringItems)) {
			return nestedRecurringItems as IDataObject[];
		}
	}

	return [];
}

function getOperationOptions(resource: string, operations: Array<{ name: string; value: string; action: string }>) {
	return {
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: [resource],
			},
		},
		options: operations,
		default: operations[0].value,
	} as INodeProperties;
}

function getIdProperty(
	displayName: string,
	name: string,
	resource: string,
	operations = ['get'],
): INodeProperties {
	return {
		displayName,
		name,
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
				show: {
					resource: [resource],
					operation: operations,
				},
			},
		};
}

function compactQueryString(input: IDataObject): IDataObject {
	const output: IDataObject = {};

	for (const [key, value] of Object.entries(input)) {
		if (value !== undefined && value !== '') {
			output[key] = value;
		}
	}

	return output;
}

function parseJsonObject(value: unknown, fieldName: string): IDataObject {
	if (typeof value === 'string') {
		try {
			const parsed = JSON.parse(value) as unknown;

			if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
				return parsed as IDataObject;
			}
		} catch {
			throw new Error(`${fieldName} must be valid JSON object.`);
		}
	}

	if (value && typeof value === 'object' && !Array.isArray(value)) {
		return value as IDataObject;
	}

	throw new Error(`${fieldName} must be a JSON object.`);
}

function parseJsonArray(value: unknown, fieldName: string): IDataObject[] {
	if (typeof value === 'string') {
		try {
			const parsed = JSON.parse(value) as unknown;

			if (Array.isArray(parsed)) {
				return parsed as IDataObject[];
			}
		} catch {
			throw new Error(`${fieldName} must be valid JSON array.`);
		}
	}

	if (Array.isArray(value)) {
		return value as IDataObject[];
	}

	throw new Error(`${fieldName} must be a JSON array.`);
}

function parseJsonList(value: unknown, fieldName: string): Array<string | number> {
	if (typeof value === 'string') {
		try {
			const parsed = JSON.parse(value) as unknown;

			if (Array.isArray(parsed)) {
				return parsed as Array<string | number>;
			}
		} catch {
			throw new Error(`${fieldName} must be valid JSON array.`);
		}
	}

	if (Array.isArray(value)) {
		return value as Array<string | number>;
	}

	throw new Error(`${fieldName} must be a JSON array.`);
}

function compactBody(input: IDataObject): IDataObject {
	const output: IDataObject = {};

	for (const [key, value] of Object.entries(input)) {
		if (value !== undefined && value !== '') {
			output[key] = value;
		}
	}

	return output;
}

function getQueryParameters(input: IDataObject): IDataObject {
	const output: IDataObject = {};
	const parameters = (input.parameters ?? []) as IDataObject[];

	for (const parameter of parameters) {
		const name = parameter.name;

		if (typeof name === 'string' && name !== '') {
			output[name] = parameter.value as string | number | boolean;
		}
	}

	return compactQueryString(output);
}

function assertEndpointPath(this: IExecuteFunctions, endpointPath: string): void {
	if (/^https?:\/\//i.test(endpointPath)) {
		throw new NodeOperationError(this.getNode(), 'Full external URLs are not allowed.');
	}

	if (!endpointPath.startsWith('/') || endpointPath.startsWith('//')) {
		throw new NodeOperationError(this.getNode(), 'Endpoint Path must start with a single /.');
	}
}

function requireFields(this: IExecuteFunctions, body: IDataObject, fields: string[]): void {
	for (const field of fields) {
		if (body[field] === undefined || body[field] === '') {
			throw new NodeOperationError(this.getNode(), `${field} is required.`);
		}
	}
}

function requireNonEmptyArray(this: IExecuteFunctions, items: IDataObject[], fieldName: string): void {
	if (items.length === 0) {
		throw new NodeOperationError(this.getNode(), `${fieldName} must contain at least one item.`);
	}
}

function requireNonEmptyObject(this: IExecuteFunctions, body: IDataObject, fieldName: string): void {
	if (Object.keys(body).length === 0) {
		throw new NodeOperationError(this.getNode(), `${fieldName} must contain at least one field.`);
	}
}

function guardTransactionBulk(this: IExecuteFunctions, items: IDataObject[]): void {
	requireNonEmptyArray.call(this, items, 'Transactions');

	if (items.length > 100) {
		throw new NodeOperationError(this.getNode(), 'Transactions cannot exceed 100 items.');
	}
}

function assertUniqueIds(this: IExecuteFunctions, items: IDataObject[]): void {
	const seen = new Set<string>();

	for (const item of items) {
		const id = item.id;

		if (id === undefined || id === '') {
			throw new NodeOperationError(this.getNode(), 'Each transaction must include id.');
		}

		const key = String(id);

		if (seen.has(key)) {
			throw new NodeOperationError(this.getNode(), `Duplicate transaction id: ${key}.`);
		}

		seen.add(key);
	}
}

function guardBulkDeleteIds(this: IExecuteFunctions, ids: Array<string | number>): void {
	if (ids.length === 0) {
		throw new NodeOperationError(this.getNode(), 'Transaction IDs must contain at least one item.');
	}

	if (ids.length > 100) {
		throw new NodeOperationError(this.getNode(), 'Transaction IDs cannot exceed 100 items.');
	}

	const seen = new Set<string>();

	for (const id of ids) {
		if (id === undefined || id === '') {
			throw new NodeOperationError(this.getNode(), 'Each transaction ID must be non-empty.');
		}

		const key = String(id);

		if (seen.has(key)) {
			throw new NodeOperationError(this.getNode(), `Duplicate transaction id: ${key}.`);
		}

		seen.add(key);
	}
}

function assertEachItemHasUpdateField(this: IExecuteFunctions, items: IDataObject[]): void {
	for (const item of items) {
		const hasUpdateField = Object.entries(item).some(([key, value]) =>
			key !== 'id' && value !== undefined && value !== '',
		);

		if (!hasUpdateField) {
			throw new NodeOperationError(this.getNode(), 'Each transaction must include at least one update field.');
		}
	}
}

function getJsonBodyProperty(
	displayName: string,
	name: string,
	resource: string,
	operations: string[],
	defaultValue: string,
	description?: string,
): INodeProperties {
	return {
		displayName,
		name,
		type: 'json',
		required: true,
		default: defaultValue,
		description,
		displayOptions: {
			show: {
				resource: [resource],
				operation: operations,
			},
		},
	};
}

function confirmDestructiveOperation(resource: string, operations: string[]): INodeProperties {
	return {
		displayName: 'Confirm Destructive Operation',
		name: 'confirmDestructiveOperation',
		type: 'boolean',
		default: false,
		required: true,
		description: 'Must be enabled to run this destructive operation.',
		displayOptions: {
			show: {
				resource: [resource],
				operation: operations,
			},
		},
	};
}

function assertDestructiveConfirmed(this: IExecuteFunctions): void {
	const confirmed = this.getNodeParameter('confirmDestructiveOperation', 0, false) as boolean;

	if (confirmed !== true) {
		throw new NodeOperationError(this.getNode(), 'Confirm Destructive Operation must be enabled.');
	}
}

function assertCustomWriteConfirmed(this: IExecuteFunctions, method: IHttpRequestMethods): void {
	if (method === 'GET') {
		return;
	}

	const confirmed = this.getNodeParameter('confirmCustomApiCallWrite', 0, false) as boolean;

	if (confirmed !== true) {
		throw new NodeOperationError(this.getNode(), 'Confirm Custom Write Operation must be enabled.');
	}
}

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
						name: 'Budget',
						value: 'budget',
					},
					{
						name: 'Category',
						value: 'category',
					},
					{
						name: 'Custom API Call',
						value: 'customApiCall',
					},
					{
						name: 'Manual Account',
						value: 'manualAccount',
					},
					{
						name: 'Plaid Account',
						value: 'plaidAccount',
					},
					{
						name: 'Recurring Item',
						value: 'recurringItem',
					},
					{
						name: 'Summary',
						value: 'summary',
					},
					{
						name: 'Tag',
						value: 'tag',
					},
					{
						name: 'Transaction',
						value: 'transaction',
					},
					{
						name: 'User',
						value: 'user',
					},
				],
				default: 'user',
			},
			getOperationOptions('user', [
				{
					name: 'Get Current User',
					value: 'getCurrent',
					action: 'Get current LunchMoney user',
				},
			]),
			getOperationOptions('category', [
				{
					name: 'Create',
					value: 'create',
					action: 'Create a LunchMoney category',
				},
				{
					name: 'Delete',
					value: 'delete',
					action: 'Delete a LunchMoney category',
				},
				{
					name: 'Get Many',
					value: 'getAll',
					action: 'Get many LunchMoney categories',
				},
				{
					name: 'Get',
					value: 'get',
					action: 'Get a LunchMoney category',
				},
				{
					name: 'Update',
					value: 'update',
					action: 'Update a LunchMoney category',
				},
			]),
			getOperationOptions('customApiCall', [
				{
					name: 'Custom API Call',
					value: 'customApiCall',
					action: 'Make custom LunchMoney API call',
				},
			]),
			getOperationOptions('tag', [
				{
					name: 'Create',
					value: 'create',
					action: 'Create a LunchMoney tag',
				},
				{
					name: 'Delete',
					value: 'delete',
					action: 'Delete a LunchMoney tag',
				},
				{
					name: 'Get Many',
					value: 'getAll',
					action: 'Get many LunchMoney tags',
				},
				{
					name: 'Get',
					value: 'get',
					action: 'Get a LunchMoney tag',
				},
				{
					name: 'Update',
					value: 'update',
					action: 'Update a LunchMoney tag',
				},
			]),
			getOperationOptions('manualAccount', [
				{
					name: 'Create',
					value: 'create',
					action: 'Create a LunchMoney manual account',
				},
				{
					name: 'Delete',
					value: 'delete',
					action: 'Delete a LunchMoney manual account',
				},
				{
					name: 'Get Many',
					value: 'getAll',
					action: 'Get many LunchMoney manual accounts',
				},
				{
					name: 'Get',
					value: 'get',
					action: 'Get a LunchMoney manual account',
				},
				{
					name: 'Update',
					value: 'update',
					action: 'Update a LunchMoney manual account',
				},
			]),
			getOperationOptions('plaidAccount', [
				{
					name: 'Get Many',
					value: 'getAll',
					action: 'Get many LunchMoney Plaid accounts',
				},
				{
					name: 'Get',
					value: 'get',
					action: 'Get a LunchMoney Plaid account',
				},
				{
					name: 'Trigger Fetch',
					value: 'fetch',
					action: 'Trigger LunchMoney Plaid fetch',
				},
			]),
			getOperationOptions('recurringItem', [
				{
					name: 'Get Many',
					value: 'getAll',
					action: 'Get many LunchMoney recurring items',
				},
				{
					name: 'Get',
					value: 'get',
					action: 'Get a LunchMoney recurring item',
				},
			]),
			getOperationOptions('budget', [
				{
					name: 'Get Settings',
					value: 'getSettings',
					action: 'Get LunchMoney budget settings',
				},
				{
					name: 'Delete',
					value: 'delete',
					action: 'Delete LunchMoney budget',
				},
				{
					name: 'Upsert',
					value: 'upsert',
					action: 'Upsert LunchMoney budget',
				},
			]),
			getOperationOptions('summary', [
				{
					name: 'Get',
					value: 'get',
					action: 'Get LunchMoney summary',
				},
			]),
			getOperationOptions('transaction', [
				{
					name: 'Get Many',
					value: 'getAll',
					action: 'Get many LunchMoney transactions',
				},
				{
					name: 'Bulk Delete',
					value: 'deleteAll',
					action: 'Delete many LunchMoney transactions',
				},
				{
					name: 'Attach File',
					value: 'attachFile',
					action: 'Attach file to LunchMoney transaction',
				},
				{
					name: 'Create Group',
					value: 'createGroup',
					action: 'Create LunchMoney transaction group',
				},
				{
					name: 'Delete Group',
					value: 'deleteGroup',
					action: 'Delete LunchMoney transaction group',
				},
				{
					name: 'Get',
					value: 'get',
					action: 'Get a LunchMoney transaction',
				},
				{
					name: 'Get Attachment URL',
					value: 'getAttachmentUrl',
					action: 'Get LunchMoney transaction attachment URL',
				},
				{
					name: 'Delete',
					value: 'delete',
					action: 'Delete a LunchMoney transaction',
				},
				{
					name: 'Delete Attachment',
					value: 'deleteAttachment',
					action: 'Delete LunchMoney transaction attachment',
				},
				{
					name: 'Insert One or More',
					value: 'insert',
					action: 'Insert one or more LunchMoney transactions',
				},
				{
					name: 'Split',
					value: 'split',
					action: 'Split a LunchMoney transaction',
				},
				{
					name: 'Unsplit',
					value: 'unsplit',
					action: 'Unsplit a LunchMoney transaction',
				},
				{
					name: 'Update',
					value: 'update',
					action: 'Update a LunchMoney transaction',
				},
				{
					name: 'Update Many',
					value: 'updateAll',
					action: 'Update many LunchMoney transactions',
				},
			]),
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						resource: returnControlsResources,
						operation: ['getAll'],
					},
				},
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				default: 50,
				displayOptions: {
					show: {
						resource: returnControlsResources,
						operation: ['getAll'],
						returnAll: [false],
					},
				},
			},
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				displayOptions: {
					show: {
						resource: ['transaction'],
						operation: ['getAll'],
					},
				},
				options: [
					{
						displayName: 'Start Date',
						name: 'start_date',
						type: 'string',
						default: '',
						description: 'Filter transactions on or after this date.',
					},
					{
						displayName: 'End Date',
						name: 'end_date',
						type: 'string',
						default: '',
						description: 'Filter transactions on or before this date.',
					},
					{
						displayName: 'Created Since',
						name: 'created_since',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Updated Since',
						name: 'updated_since',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Manual Account ID',
						name: 'manual_account_id',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Plaid Account ID',
						name: 'plaid_account_id',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Recurring Item ID',
						name: 'recurring_id',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Category ID',
						name: 'category_id',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Tag ID',
						name: 'tag_id',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Is Group Parent',
						name: 'is_group_parent',
						type: 'boolean',
						default: false,
					},
					{
						displayName: 'Status',
						name: 'status',
						type: 'options',
						options: [
							{
								name: 'Cleared',
								value: 'cleared',
							},
							{
								name: 'Uncleared',
								value: 'uncleared',
							},
						],
						default: 'cleared',
					},
					{
						displayName: 'Is Pending',
						name: 'is_pending',
						type: 'boolean',
						default: false,
					},
					{
						displayName: 'Include Pending',
						name: 'include_pending',
						type: 'boolean',
						default: false,
					},
					{
						displayName: 'Include Metadata',
						name: 'include_metadata',
						type: 'boolean',
						default: false,
					},
					{
						displayName: 'Include Split Parents',
						name: 'include_split_parents',
						type: 'boolean',
						default: false,
					},
					{
						displayName: 'Include Group Children',
						name: 'include_group_children',
						type: 'boolean',
						default: false,
					},
					{
						displayName: 'Include Children',
						name: 'include_children',
						type: 'boolean',
						default: false,
					},
					{
						displayName: 'Include Files',
						name: 'include_files',
						type: 'boolean',
						default: false,
					},
				],
			},
			{
				displayName: 'Method',
				name: 'customMethod',
				type: 'options',
				default: 'GET',
				displayOptions: {
					show: {
						resource: ['customApiCall'],
						operation: ['customApiCall'],
					},
				},
				options: [
					{ name: 'DELETE', value: 'DELETE' },
					{ name: 'GET', value: 'GET' },
					{ name: 'PATCH', value: 'PATCH' },
					{ name: 'POST', value: 'POST' },
					{ name: 'PUT', value: 'PUT' },
				],
			},
			{
				displayName: 'Endpoint Path',
				name: 'endpointPath',
				type: 'string',
				required: true,
				default: '/',
				description: 'LunchMoney API path only. Full external URLs are blocked.',
				displayOptions: {
					show: {
						resource: ['customApiCall'],
						operation: ['customApiCall'],
					},
				},
			},
			{
				displayName: 'Query Parameters',
				name: 'queryParameters',
				type: 'fixedCollection',
				default: {},
				placeholder: 'Add Parameter',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						resource: ['customApiCall'],
						operation: ['customApiCall'],
					},
				},
				options: [
					{
						displayName: 'Parameter',
						name: 'parameters',
						values: [
							{
								displayName: 'Name',
								name: 'name',
								type: 'string',
								default: '',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
							},
						],
					},
				],
			},
			getJsonBodyProperty(
				'JSON Body',
				'customBody',
				'customApiCall',
				['customApiCall'],
				'{}',
				'Optional JSON request body.',
			),
			{
				displayName: 'Confirm Custom Write Operation',
				name: 'confirmCustomApiCallWrite',
				type: 'boolean',
				default: false,
				required: true,
				description: 'Must be enabled to run Custom API Call with POST, PUT, PATCH, or DELETE.',
				displayOptions: {
					show: {
						resource: ['customApiCall'],
						operation: ['customApiCall'],
						customMethod: ['POST', 'PUT', 'PATCH', 'DELETE'],
					},
				},
			},
			getJsonBodyProperty(
				'Category Fields',
				'categoryFields',
				'category',
				['create', 'update'],
				'{}',
				'Raw LunchMoney category fields. Create requires name.',
			),
			getJsonBodyProperty(
				'Tag Fields',
				'tagFields',
				'tag',
				['create', 'update'],
				'{}',
				'Raw LunchMoney tag fields. Create requires name.',
			),
			getJsonBodyProperty(
				'Manual Account Fields',
				'manualAccountFields',
				'manualAccount',
				['create', 'update'],
				'{}',
				'Raw LunchMoney manual account fields. Create requires name, type, balance.',
			),
			{
				displayName: 'Fetch Options',
				name: 'fetchOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['plaidAccount'],
						operation: ['fetch'],
					},
				},
				options: [
					{
						displayName: 'Plaid Account ID',
						name: 'id',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Start Date',
						name: 'start_date',
						type: 'string',
						default: '',
					},
					{
						displayName: 'End Date',
						name: 'end_date',
						type: 'string',
						default: '',
					},
				],
			},
			getJsonBodyProperty(
				'Budget Fields',
				'budgetFields',
				'budget',
				['upsert'],
				'{}',
				'Raw LunchMoney budget fields. Requires start_date, category_id, amount.',
			),
			getJsonBodyProperty(
				'Budget Delete Fields',
				'budgetDeleteFields',
				'budget',
				['delete'],
				'{}',
				'Budget delete query fields. Requires category_id and start_date.',
			),
			getJsonBodyProperty(
				'Transaction Fields',
				'transactionFields',
				'transaction',
				['update'],
				'{}',
				'Raw LunchMoney transaction update fields.',
			),
			getJsonBodyProperty(
				'Transactions',
				'transactions',
				'transaction',
				['insert', 'updateAll'],
				'[]',
				'Array of raw LunchMoney transactions. Bulk operations capped at 100 items.',
			),
			getJsonBodyProperty(
				'Transaction IDs',
				'transactionIds',
				'transaction',
				['deleteAll'],
				'[]',
				'Array of transaction IDs to delete. Bulk delete capped at 100 IDs.',
			),
			getJsonBodyProperty(
				'Group Fields',
				'transactionGroupFields',
				'transaction',
				['createGroup'],
				'{}',
				'Group body. Requires ids, payee, date.',
			),
			getJsonBodyProperty(
				'Split Fields',
				'transactionSplitFields',
				'transaction',
				['split'],
				'{}',
				'Split body. Requires child_transactions array.',
			),
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				required: true,
				default: 'data',
				description: 'Input binary property containing the file to upload.',
				displayOptions: {
					show: {
						resource: ['transaction'],
						operation: ['attachFile'],
					},
				},
			},
			{
				displayName: 'Notes',
				name: 'attachmentNotes',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['transaction'],
						operation: ['attachFile'],
					},
				},
			},
			{
				displayName: 'File ID',
				name: 'fileId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['transaction'],
						operation: ['getAttachmentUrl', 'deleteAttachment'],
					},
				},
			},
			confirmDestructiveOperation('category', ['delete']),
			confirmDestructiveOperation('manualAccount', ['delete']),
			confirmDestructiveOperation('tag', ['delete']),
			confirmDestructiveOperation('budget', ['delete']),
			confirmDestructiveOperation('transaction', [
				'delete',
				'deleteAll',
				'deleteGroup',
				'unsplit',
				'deleteAttachment',
			]),
			{
				displayName: 'Update Balance',
				name: 'updateBalance',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						resource: ['transaction'],
						operation: ['update'],
					},
				},
			},
			getIdProperty('Category ID', 'categoryId', 'category', ['get', 'update', 'delete']),
			getIdProperty('Tag ID', 'tagId', 'tag', ['get', 'update', 'delete']),
			getIdProperty('Manual Account ID', 'manualAccountId', 'manualAccount', ['get', 'update', 'delete']),
			getIdProperty('Plaid Account ID', 'plaidAccountId', 'plaidAccount'),
			getIdProperty('Recurring Item ID', 'recurringItemId', 'recurringItem'),
			getIdProperty('Transaction ID', 'transactionId', 'transaction', [
				'get',
				'update',
				'delete',
				'attachFile',
				'deleteGroup',
				'split',
				'unsplit',
			]),
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		if (resource === 'customApiCall' && operation === 'customApiCall') {
			const method = this.getNodeParameter('customMethod', 0) as IHttpRequestMethods;
			const endpointPath = this.getNodeParameter('endpointPath', 0) as string;
			const queryParameters = getQueryParameters(
				this.getNodeParameter('queryParameters', 0, {}) as IDataObject,
			);
			const body = compactBody(parseJsonObject(
				this.getNodeParameter('customBody', 0, {}),
				'JSON Body',
			));

			assertEndpointPath.call(this, endpointPath);
			assertCustomWriteConfirmed.call(this, method);

			const response = await lunchMoneyApiRequest.call(this, {
				method,
				url: endpointPath,
				qs: queryParameters,
				body: Object.keys(body).length > 0 ? body : undefined,
			}) as IDataObject | IDataObject[];

			return [this.helpers.returnJsonArray(response)];
		}

		if (resource === 'user' && operation === 'getCurrent') {
			const response = await lunchMoneyApiRequest.call(this, {
				method: 'GET',
				url: '/me',
			}) as IDataObject;

			return [this.helpers.returnJsonArray(response)];
		}

		if (resource === 'budget' && operation === 'delete') {
			assertDestructiveConfirmed.call(this);

			const qs = compactQueryString(parseJsonObject(
				this.getNodeParameter('budgetDeleteFields', 0),
				'Budget Delete Fields',
			));

			requireFields.call(this, qs, ['category_id', 'start_date']);

			const response = await lunchMoneyApiRequest.call(this, {
				method: 'DELETE',
				url: '/budgets',
				qs,
			}) as IDataObject;

			return [this.helpers.returnJsonArray(response)];
		}

		if (resource === 'budget' && operation === 'getSettings') {
			const response = await lunchMoneyApiRequest.call(this, {
				method: 'GET',
				url: '/budgets/settings',
			}) as IDataObject;

			return [this.helpers.returnJsonArray(response)];
		}

		if (resource === 'budget' && operation === 'upsert') {
			const body = compactBody(parseJsonObject(
				this.getNodeParameter('budgetFields', 0),
				'Budget Fields',
			));

			requireFields.call(this, body, ['start_date', 'category_id', 'amount']);

			const response = await lunchMoneyApiRequest.call(this, {
				method: 'PUT',
				url: '/budgets',
				body,
			}) as IDataObject;

			return [this.helpers.returnJsonArray(response)];
		}

		if (resource === 'summary' && operation === 'get') {
			const response = await lunchMoneyApiRequest.call(this, {
				method: 'GET',
				url: '/summary',
			}) as IDataObject;

			return [this.helpers.returnJsonArray(response)];
		}

		if (resource === 'category' && ['create', 'update'].includes(operation)) {
				const body = compactBody(parseJsonObject(
					this.getNodeParameter('categoryFields', 0),
					'Category Fields',
				));

				if (operation === 'create') {
					requireFields.call(this, body, ['name']);
				} else {
					requireNonEmptyObject.call(this, body, 'Category Fields');
				}

				const categoryId = operation === 'update'
					? this.getNodeParameter('categoryId', 0) as string
					: '';
			const response = await lunchMoneyApiRequest.call(this, {
				method: operation === 'create' ? 'POST' : 'PUT',
				url: operation === 'create' ? '/categories' : `/categories/${encodeURIComponent(categoryId)}`,
				body,
			}) as IDataObject;

			return [this.helpers.returnJsonArray(response)];
		}

		if (resource === 'category' && operation === 'delete') {
			assertDestructiveConfirmed.call(this);

			const categoryId = this.getNodeParameter('categoryId', 0) as string;
			const response = await lunchMoneyApiRequest.call(this, {
				method: 'DELETE',
				url: `/categories/${encodeURIComponent(categoryId)}`,
			}) as IDataObject;

			return [this.helpers.returnJsonArray(response)];
		}

		if (resource === 'tag' && ['create', 'update'].includes(operation)) {
			const body = compactBody(parseJsonObject(
				this.getNodeParameter('tagFields', 0),
				'Tag Fields',
			));

				if (operation === 'create') {
					requireFields.call(this, body, ['name']);
				} else {
					requireNonEmptyObject.call(this, body, 'Tag Fields');
				}

				const tagId = operation === 'update'
					? this.getNodeParameter('tagId', 0) as string
					: '';
			const response = await lunchMoneyApiRequest.call(this, {
				method: operation === 'create' ? 'POST' : 'PUT',
				url: operation === 'create' ? '/tags' : `/tags/${encodeURIComponent(tagId)}`,
				body,
			}) as IDataObject;

			return [this.helpers.returnJsonArray(response)];
		}

		if (resource === 'tag' && operation === 'delete') {
			assertDestructiveConfirmed.call(this);

			const tagId = this.getNodeParameter('tagId', 0) as string;
			const response = await lunchMoneyApiRequest.call(this, {
				method: 'DELETE',
				url: `/tags/${encodeURIComponent(tagId)}`,
			}) as IDataObject;

			return [this.helpers.returnJsonArray(response)];
		}

		if (resource === 'manualAccount' && ['create', 'update'].includes(operation)) {
			const body = compactBody(parseJsonObject(
				this.getNodeParameter('manualAccountFields', 0),
				'Manual Account Fields',
			));

				if (operation === 'create') {
					requireFields.call(this, body, ['name', 'type', 'balance']);
				} else {
					requireNonEmptyObject.call(this, body, 'Manual Account Fields');
				}

				const manualAccountId = operation === 'update'
					? this.getNodeParameter('manualAccountId', 0) as string
					: '';
			const response = await lunchMoneyApiRequest.call(this, {
				method: operation === 'create' ? 'POST' : 'PUT',
				url: operation === 'create'
					? '/manual_accounts'
					: `/manual_accounts/${encodeURIComponent(manualAccountId)}`,
				body,
			}) as IDataObject;

			return [this.helpers.returnJsonArray(response)];
		}

		if (resource === 'manualAccount' && operation === 'delete') {
			assertDestructiveConfirmed.call(this);

			const manualAccountId = this.getNodeParameter('manualAccountId', 0) as string;
			const response = await lunchMoneyApiRequest.call(this, {
				method: 'DELETE',
				url: `/manual_accounts/${encodeURIComponent(manualAccountId)}`,
			}) as IDataObject;

			return [this.helpers.returnJsonArray(response)];
		}

		if (resource === 'plaidAccount' && operation === 'fetch') {
			const qs = compactQueryString(
				this.getNodeParameter('fetchOptions', 0, {}) as IDataObject,
			);
			const response = await lunchMoneyApiRequest.call(this, {
				method: 'POST',
				url: '/plaid_accounts/fetch',
				qs,
			}) as IDataObject;

			return [this.helpers.returnJsonArray(response)];
		}

		if (resource === 'transaction' && operation === 'insert') {
			const transactions = parseJsonArray(
				this.getNodeParameter('transactions', 0),
				'Transactions',
			);

			guardTransactionBulk.call(this, transactions);

			for (const transaction of transactions) {
				requireFields.call(this, transaction, ['date', 'amount', 'payee']);
			}

			const response = await lunchMoneyApiRequest.call(this, {
				method: 'POST',
				url: '/transactions',
				body: {
					transactions,
				},
			}) as IDataObject;

			return [this.helpers.returnJsonArray(response)];
		}

		if (resource === 'transaction' && operation === 'update') {
			const transactionId = this.getNodeParameter('transactionId', 0) as string;
			const body = compactBody(parseJsonObject(
				this.getNodeParameter('transactionFields', 0),
				'Transaction Fields',
			));

			requireNonEmptyObject.call(this, body, 'Transaction Fields');

			const updateBalance = this.getNodeParameter('updateBalance', 0) as boolean;
			const response = await lunchMoneyApiRequest.call(this, {
				method: 'PUT',
				url: `/transactions/${encodeURIComponent(transactionId)}`,
				qs: updateBalance ? { update_balance: true } : undefined,
				body,
			}) as IDataObject;

			return [this.helpers.returnJsonArray(response)];
		}

		if (resource === 'transaction' && operation === 'updateAll') {
			const transactions = parseJsonArray(
				this.getNodeParameter('transactions', 0),
				'Transactions',
			);

				guardTransactionBulk.call(this, transactions);
				assertUniqueIds.call(this, transactions);
				assertEachItemHasUpdateField.call(this, transactions);

				const response = await lunchMoneyApiRequest.call(this, {
					method: 'PUT',
				url: '/transactions',
				body: {
					transactions,
				},
			}) as IDataObject;

			return [this.helpers.returnJsonArray(response)];
		}

		if (resource === 'transaction' && operation === 'delete') {
			assertDestructiveConfirmed.call(this);

			const transactionId = this.getNodeParameter('transactionId', 0) as string;
			const response = await lunchMoneyApiRequest.call(this, {
				method: 'DELETE',
				url: `/transactions/${encodeURIComponent(transactionId)}`,
			}) as IDataObject;

			return [this.helpers.returnJsonArray(response)];
		}

		if (resource === 'transaction' && operation === 'deleteAll') {
			assertDestructiveConfirmed.call(this);

			const ids = parseJsonList(
				this.getNodeParameter('transactionIds', 0),
				'Transaction IDs',
			);

			guardBulkDeleteIds.call(this, ids);

			const response = await lunchMoneyApiRequest.call(this, {
				method: 'DELETE',
				url: '/transactions',
				body: {
					ids,
				},
			}) as IDataObject;

			return [this.helpers.returnJsonArray(response)];
		}

		if (resource === 'transaction' && operation === 'createGroup') {
			const body = compactBody(parseJsonObject(
				this.getNodeParameter('transactionGroupFields', 0),
				'Group Fields',
			));

			requireFields.call(this, body, ['ids', 'payee', 'date']);

			if (!Array.isArray(body.ids) || body.ids.length === 0) {
				throw new NodeOperationError(this.getNode(), 'ids must contain at least one item.');
			}

			const response = await lunchMoneyApiRequest.call(this, {
				method: 'POST',
				url: '/transactions/group',
				body,
			}) as IDataObject;

			return [this.helpers.returnJsonArray(response)];
		}

		if (resource === 'transaction' && operation === 'deleteGroup') {
			assertDestructiveConfirmed.call(this);

			const transactionId = this.getNodeParameter('transactionId', 0) as string;
			const response = await lunchMoneyApiRequest.call(this, {
				method: 'DELETE',
				url: `/transactions/group/${encodeURIComponent(transactionId)}`,
			}) as IDataObject;

			return [this.helpers.returnJsonArray(response)];
		}

		if (resource === 'transaction' && operation === 'split') {
			const transactionId = this.getNodeParameter('transactionId', 0) as string;
			const body = compactBody(parseJsonObject(
				this.getNodeParameter('transactionSplitFields', 0),
				'Split Fields',
			));

			requireFields.call(this, body, ['child_transactions']);

			if (!Array.isArray(body.child_transactions) || body.child_transactions.length === 0) {
				throw new NodeOperationError(this.getNode(), 'child_transactions must contain at least one item.');
			}

			const response = await lunchMoneyApiRequest.call(this, {
				method: 'POST',
				url: `/transactions/split/${encodeURIComponent(transactionId)}`,
				body,
			}) as IDataObject;

			return [this.helpers.returnJsonArray(response)];
		}

		if (resource === 'transaction' && operation === 'unsplit') {
			assertDestructiveConfirmed.call(this);

			const transactionId = this.getNodeParameter('transactionId', 0) as string;
			const response = await lunchMoneyApiRequest.call(this, {
				method: 'DELETE',
				url: `/transactions/split/${encodeURIComponent(transactionId)}`,
			}) as IDataObject;

			return [this.helpers.returnJsonArray(response)];
		}

		if (resource === 'transaction' && operation === 'attachFile') {
			const transactionId = this.getNodeParameter('transactionId', 0) as string;
			const binaryPropertyName = this.getNodeParameter('binaryPropertyName', 0) as string;
			const notes = this.getNodeParameter('attachmentNotes', 0, '') as string;
			const binaryData = this.helpers.assertBinaryData(0, binaryPropertyName);
			const fileBuffer = await this.helpers.getBinaryDataBuffer(0, binaryPropertyName);

			if (fileBuffer.length >= MAX_ATTACHMENT_FILE_SIZE_BYTES) {
				throw new NodeOperationError(this.getNode(), 'Attachment file must be less than 10 MB.');
			}

			const formData: IDataObject = {
				file: {
					value: fileBuffer,
					options: {
						filename: binaryData.fileName,
						contentType: binaryData.mimeType,
					},
				},
			};

			if (notes !== '') {
				formData.notes = notes;
			}

			const response = await lunchMoneyApiRequest.call(this, {
				method: 'POST',
				url: `/transactions/${encodeURIComponent(transactionId)}/attachments`,
				formData,
			}) as IDataObject;

			return [this.helpers.returnJsonArray(response)];
		}

		if (resource === 'transaction' && operation === 'getAttachmentUrl') {
			const fileId = this.getNodeParameter('fileId', 0) as string;
			const response = await lunchMoneyApiRequest.call(this, {
				method: 'GET',
				url: `/transactions/attachments/${encodeURIComponent(fileId)}`,
			}) as IDataObject;

			return [this.helpers.returnJsonArray(response)];
		}

		if (resource === 'transaction' && operation === 'deleteAttachment') {
			assertDestructiveConfirmed.call(this);

			const fileId = this.getNodeParameter('fileId', 0) as string;
			const response = await lunchMoneyApiRequest.call(this, {
				method: 'DELETE',
				url: `/transactions/attachments/${encodeURIComponent(fileId)}`,
			}) as IDataObject;

			return [this.helpers.returnJsonArray(response)];
		}

		if (resource === 'transaction' && operation === 'getAll') {
			const returnAll = this.getNodeParameter('returnAll', 0) as boolean;
			const filters = compactQueryString(
				this.getNodeParameter('filters', 0, {}) as IDataObject,
			);

			for (const filterName of Object.keys(filters)) {
				if (!transactionFilters.includes(filterName)) {
					delete filters[filterName];
				}
			}

			if (returnAll) {
				const transactions = await lunchMoneyApiRequestAllItems.call(this, {
					method: 'GET',
					url: '/transactions',
					responseKey: 'transactions',
					qs: filters,
				}) as IDataObject[];

				return [this.helpers.returnJsonArray(transactions)];
			}

			const limit = this.getNodeParameter('limit', 0) as number;
			const response = await lunchMoneyApiRequest.call(this, {
				method: 'GET',
				url: '/transactions',
				qs: {
					...filters,
					limit,
					offset: 0,
				},
			}) as IDataObject;

			return [this.helpers.returnJsonArray(
				getListItems(response, 'transactions').slice(0, limit),
			)];
		}

		if (resource === 'transaction' && operation === 'get') {
			const transactionId = this.getNodeParameter('transactionId', 0) as string;
			const response = await lunchMoneyApiRequest.call(this, {
				method: 'GET',
				url: `/transactions/${encodeURIComponent(transactionId)}`,
			}) as IDataObject;

			return [this.helpers.returnJsonArray(response)];
		}

		const listOperation = listOperations.find(
			(candidate) => candidate.resource === resource && candidate.operation === operation,
		);

		if (listOperation) {
			const returnAll = this.getNodeParameter('returnAll', 0) as boolean;
			const response = await lunchMoneyApiRequest.call(this, {
				method: 'GET',
				url: listOperation.url,
			}) as IDataObject;

			let items = getListItems(response, listOperation.responseKey);

			if (!returnAll) {
				const limit = this.getNodeParameter('limit', 0) as number;
				items = items.slice(0, limit);
			}

			return [this.helpers.returnJsonArray(items)];
		}

		const singleOperation = singleOperations.find(
			(candidate) => candidate.resource === resource && candidate.operation === operation,
		);

		if (singleOperation) {
			const id = this.getNodeParameter(singleOperation.idParameter, 0) as string;
			const response = await lunchMoneyApiRequest.call(this, {
				method: 'GET',
				url: singleOperation.url(encodeURIComponent(id)),
			}) as IDataObject;

			return [this.helpers.returnJsonArray(response)];
		}

		throw new NodeOperationError(
			this.getNode(),
			`Unsupported LunchMoney operation: ${resource}.${operation}`,
		);
	}
}
