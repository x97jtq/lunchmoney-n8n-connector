export const fakeLunchMoneyApiKey = 'lm_test_mock_token_000000000000000000000000';

export const fakeBaseUrl = 'https://mock.lunchmoney.test/v2';

export const fakeNode = {
	name: 'LunchMoney',
	type: 'n8n-nodes-lunchmoney.lunchMoney',
	typeVersion: 1,
	position: [0, 0],
	parameters: {},
};

export const fakeTransactionBody = {
	transactions: [
		{
			id: 1001,
			payee: 'Mock Coffee',
			amount: '4.25',
			date: '2026-01-15',
		},
	],
};

export const fakeTransactionResponse = {
	transactions: [
		{
			id: 1001,
			payee: 'Mock Coffee',
			amount: '4.25',
			date: '2026-01-15',
		},
		{
			id: 1002,
			payee: 'Mock Grocery',
			amount: '25.00',
			date: '2026-01-16',
		},
	],
	has_more: false,
};

export const fakeTransactionDateFilteredResponse = {
	transactions: [
		{
			id: 1101,
			payee: 'Mock Date Filter One',
			amount: '11.00',
			date: '2026-02-03',
		},
	],
	has_more: false,
};

export const fakePaginatedTransactions = [
	{
		id: 1201,
		payee: 'Mock Page Transaction One',
		amount: '12.01',
		date: '2026-03-01',
	},
	{
		id: 1202,
		payee: 'Mock Page Transaction Two',
		amount: '12.02',
		date: '2026-03-02',
	},
];

export const fakeCategoryResponse = {
	categories: [
		{ id: 101, name: 'Mock Groceries' },
		{ id: 102, name: 'Mock Utilities' },
	],
};

export const fakeTagResponse = {
	tags: [
		{ id: 201, name: 'mock-review' },
		{ id: 202, name: 'mock-tax' },
	],
};

export const fakeManualAccountResponse = {
	manual_accounts: [
		{ id: 301, name: 'Mock Cash Wallet' },
		{ id: 302, name: 'Mock Savings Jar' },
	],
};

export const fakePlaidAccountResponse = {
	plaid_accounts: [
		{ id: 401, name: 'Mock Plaid Checking' },
		{ id: 402, name: 'Mock Plaid Credit' },
	],
};

export const fakeRecurringItemResponse = {
	recurring_items: {
		recurring_items: [
			{ id: 501, payee: 'Mock Subscription' },
			{ id: 502, payee: 'Mock Membership' },
		],
	},
};

export const fakeBudgetSettingsResponse = {
	budget_name: 'Mock Budget',
	currency: 'USD',
};

export const fakeSummaryResponse = {
	month: '2026-01',
	income: '1000.00',
	expenses: '250.00',
};

export const fakeCategoryWriteBody = {
	name: 'Mock Category',
	description: 'Synthetic category',
};

export const fakeManualAccountWriteBody = {
	name: 'Mock Manual Account',
	type: 'cash',
	balance: '100.00',
	currency: 'USD',
};

export const fakeTagWriteBody = {
	name: 'mock-tag',
};

export const fakeBudgetWriteBody = {
	start_date: '2026-01-01',
	category_id: 101,
	amount: '250.00',
	currency: 'USD',
};

export const fakeTransactionsWriteBody = [
	{
		date: '2026-01-15',
		amount: '4.25',
		payee: 'Mock Coffee',
		category_id: 101,
	},
	{
		date: '2026-01-16',
		amount: '25.00',
		payee: 'Mock Grocery',
		category_id: 101,
	},
];

export const fakeTransactionsUpdateBody = [
	{
		id: 1001,
		category_id: 102,
	},
	{
		id: 1002,
		notes: 'Synthetic update',
	},
];

export const fakeTransactionGroupBody = {
	ids: [1001, 1002],
	payee: 'Mock Group',
	date: '2026-01-20',
};

export const fakeTransactionGroupResponse = {
	id: 2001,
	children: [
		{ id: 1001, payee: 'Mock Group Child A' },
		{ id: 1002, payee: 'Mock Group Child B' },
	],
};

export const fakeTransactionSplitBody = {
	child_transactions: [
		{ amount: '2.00', payee: 'Mock Split A', date: '2026-01-20' },
		{ amount: '3.00', payee: 'Mock Split B', date: '2026-01-20' },
	],
};

export const fakeTransactionSplitResponse = {
	id: 1001,
	children: [
		{ id: 1301, payee: 'Mock Split A' },
		{ id: 1302, payee: 'Mock Split B' },
	],
};

export const fakeDeleteResponse = {
	success: true,
};

export const fakeAttachmentBinaryPropertyName = 'receipt';

export const fakeAttachmentBinaryData = {
	fileName: 'synthetic-receipt.pdf',
	mimeType: 'application/pdf',
};

export const fakeAttachmentBuffer = Buffer.from('synthetic-file-bytes');

export const fakeAttachmentNotes = 'Synthetic receipt';

export const fakeAttachmentResponse = {
	id: 'file_123',
	original_name: 'synthetic-receipt.pdf',
};
