/**
 * Minimal typed API client for talking to the Hono backend.
 *
 * In dev, requests use relative URLs (`/api/...`) and Vite's proxy
 * forwards them to the API. In production, set `VITE_API_URL` to the
 * absolute origin of the deployed API.
 *
 * Mock auth: if a user id is stored in localStorage under `x-user-id`,
 * it gets sent as a header on every request. The role toggle written
 * in the next sub-step is what populates that key.
 */

export class ApiError extends Error {
	readonly status: number;
	readonly statusText: string;
	readonly body: unknown;

	constructor(status: number, statusText: string, body: unknown) {
		super(`API error ${status}: ${statusText}`);
		this.name = "ApiError";
		this.status = status;
		this.statusText = statusText;
		this.body = body;
	}
}

const USER_ID_STORAGE_KEY = "x-user-id";

function getUserId(): string | null {
	return window.localStorage.getItem(USER_ID_STORAGE_KEY);
}

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

export interface ApiRequestOptions {
	method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
	body?: unknown;
	signal?: AbortSignal;
	headers?: Record<string, string>;
	/**
	 * Optional response parser/validator. Pass a Zod schema's `.parse`
	 * (or any `(data: unknown) => T` function) to narrow the response
	 * type with runtime validation.
	 */
	parse?: (data: unknown) => unknown;
}

export async function apiRequest<TResponse>(
	path: string,
	options: ApiRequestOptions = {},
): Promise<TResponse> {
	const { method = "GET", body, signal, headers = {}, parse } = options;

	const userId = getUserId();
	const finalHeaders: Record<string, string> = {
		Accept: "application/json",
		...headers,
	};
	if (userId !== null) finalHeaders["x-user-id"] = userId;
	if (body !== undefined) finalHeaders["Content-Type"] = "application/json";

	const response = await fetch(`${BASE_URL}${path}`, {
		method,
		headers: finalHeaders,
		body: body !== undefined ? JSON.stringify(body) : undefined,
		signal,
	});

	const text = await response.text();
	const parsed: unknown = text.length > 0 ? JSON.parse(text) : null;

	if (!response.ok) {
		throw new ApiError(response.status, response.statusText, parsed);
	}

	return (parse ? parse(parsed) : parsed) as TResponse;
}

type OptionsWithoutMethodAndBody = Omit<ApiRequestOptions, "method" | "body">;

export const api = {
	get: <T>(path: string, options?: OptionsWithoutMethodAndBody) =>
		apiRequest<T>(path, { ...options, method: "GET" }),
	post: <T>(path: string, body: unknown, options?: OptionsWithoutMethodAndBody) =>
		apiRequest<T>(path, { ...options, method: "POST", body }),
	patch: <T>(path: string, body: unknown, options?: OptionsWithoutMethodAndBody) =>
		apiRequest<T>(path, { ...options, method: "PATCH", body }),
	delete: <T>(path: string, options?: OptionsWithoutMethodAndBody) =>
		apiRequest<T>(path, { ...options, method: "DELETE" }),
};
