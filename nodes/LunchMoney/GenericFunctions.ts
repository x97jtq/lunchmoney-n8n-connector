import type {
	IAllExecuteFunctions,
	IDataObject,
	IHttpRequestMethods,
	IHttpRequestOptions,
	JsonValue,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

export const LUNCHMONEY_CREDENTIALS_NAME = 'lunchMoneyApi';
export const LUNCHMONEY_DEFAULT_BASE_URL = 'https://api.lunchmoney.dev/v2';

type LunchMoneyCredentials = {
	baseUrl?: string;
};

export type LunchMoneyRequestContext = IAllExecuteFunctions;

export type LunchMoneyApiRequestOptions = {
	method: IHttpRequestMethods;
	url: string;
	qs?: IDataObject;
	body?: IHttpRequestOptions['body'];
	formData?: IDataObject;
	headers?: IDataObject;
};

export type LunchMoneyPaginationOptions = LunchMoneyApiRequestOptions & {
	responseKey: string;
	limit?: number;
	offset?: number;
};

type ErrorWithResponse = Error & {
	statusCode?: number;
	response?: {
		statusCode?: number;
		statusMessage?: string;
		body?: unknown;
	};
	options?: IHttpRequestOptions;
};

function normalizeBaseUrl(baseUrl: string): string {
	const normalized = baseUrl.trim().replace(/\/+$/, '');

	if (!normalized) {
		return LUNCHMONEY_DEFAULT_BASE_URL;
	}

	new URL(normalized);

	return normalized;
}

export function redactSensitiveRequestData(
	requestOptions: IHttpRequestOptions,
): JsonObject {
	const headers = { ...(requestOptions.headers ?? {}) };

	if ('Authorization' in headers) {
		headers.Authorization = '[REDACTED]';
	}

	if ('authorization' in headers) {
		headers.authorization = '[REDACTED]';
	}

	const redactedRequest: JsonObject = {};

	if (requestOptions.method !== undefined) {
		redactedRequest.method = requestOptions.method;
	}

	redactedRequest.url = requestOptions.url;

	if (requestOptions.baseURL !== undefined) {
		redactedRequest.baseURL = requestOptions.baseURL;
	}

	redactedRequest.headers = headers as JsonObject;

	if (requestOptions.qs !== undefined) {
		redactedRequest.qs = requestOptions.qs as JsonObject;
	}

	return redactedRequest;
}

function toJsonValue(value: string | number): JsonValue {
	return value;
}

export function normalizeLunchMoneyApiError(
	this: LunchMoneyRequestContext,
	error: unknown,
	requestOptions: IHttpRequestOptions,
): NodeApiError {
	const apiError = error as ErrorWithResponse;
	const statusCode = apiError.response?.statusCode ?? apiError.statusCode;
	const message = apiError.message || 'LunchMoney API request failed';

	const errorResponse: JsonObject = {
		message,
		request: redactSensitiveRequestData({
			...requestOptions,
			headers: {
				...(requestOptions.headers ?? {}),
				...(apiError.options?.headers ?? {}),
			},
		}),
	};

	if (statusCode !== undefined) {
		errorResponse.statusCode = toJsonValue(statusCode);
	}

	if (apiError.response?.statusMessage !== undefined) {
		errorResponse.statusMessage = apiError.response.statusMessage;
	}

	return new NodeApiError(this.getNode(), errorResponse, {
		message,
		description: `Request: ${JSON.stringify(errorResponse.request)}`,
		httpCode: statusCode?.toString(),
	});
}

export async function lunchMoneyApiRequest<T = IDataObject | IDataObject[]>(
	this: LunchMoneyRequestContext,
	options: LunchMoneyApiRequestOptions,
): Promise<T> {
	const credentials = await this.getCredentials<LunchMoneyCredentials>(LUNCHMONEY_CREDENTIALS_NAME);
	const baseURL = normalizeBaseUrl(credentials.baseUrl ?? LUNCHMONEY_DEFAULT_BASE_URL);

	const headers: IDataObject = {
		Accept: 'application/json',
		...(options.headers ?? {}),
	};

	if (options.formData === undefined) {
		headers['Content-Type'] = 'application/json';
	}

	const requestOptions: IHttpRequestOptions = {
		method: options.method,
		url: options.url,
		baseURL,
		headers,
		qs: options.qs,
		body: options.body,
		json: options.formData === undefined,
	};

	if (options.formData !== undefined) {
		(requestOptions as IHttpRequestOptions & { formData: IDataObject }).formData = options.formData;
	}

	try {
		return await this.helpers.httpRequestWithAuthentication.call(
			this,
			LUNCHMONEY_CREDENTIALS_NAME,
			requestOptions,
		);
	} catch (error) {
		throw normalizeLunchMoneyApiError.call(this, error, requestOptions);
	}
}

export async function lunchMoneyApiRequestAllItems<T = IDataObject>(
	this: LunchMoneyRequestContext,
	options: LunchMoneyPaginationOptions,
): Promise<T[]> {
	const limit = options.limit ?? 100;
	let offset = options.offset ?? 0;
	const items: T[] = [];

	for (;;) {
		const response = await lunchMoneyApiRequest.call(this, {
				method: options.method,
				url: options.url,
				headers: options.headers,
				body: options.body,
				formData: options.formData,
				qs: {
				...(options.qs ?? {}),
				limit,
				offset,
			},
		}) as Record<string, unknown>;

		const pageItems = response[options.responseKey];

		if (!Array.isArray(pageItems)) {
			throw new NodeApiError(this.getNode(), {
				message: `LunchMoney API response did not include a ${options.responseKey} array.`,
			});
		}

		items.push(...(pageItems as T[]));

		if (response.has_more !== true || pageItems.length === 0) {
			return items;
		}

		offset += pageItems.length;
	}
}
