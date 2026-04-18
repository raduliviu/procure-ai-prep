/**
 * Minimal typed API client.
 *
 * In dev, paths like `/api/...` are relative and Vite's proxy forwards
 * them to the backend. In prod, set `VITE_API_URL` to the absolute API
 * origin.
 *
 * Mock auth: if `localStorage['x-user-id']` is set, its value is sent
 * as the `x-user-id` header on every request. How it gets set (a login
 * flow, a role toggle, a hard-coded default) is the consumer's call.
 *
 * On non-2xx the thrown Error carries `.status` and `.body` for
 * structured error handling. Errors are detected via duck-typing
 * (`'status' in err`), not `instanceof`, so no custom class.
 */

export interface ApiRequestOptions {
	method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
	body?: unknown;
	signal?: AbortSignal;
	headers?: Record<string, string>;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
	const { method = "GET", body, signal, headers = {} } = options;

	const finalHeaders: Record<string, string> = { ...headers };
	const userId = window.localStorage.getItem("x-user-id");
	if (userId !== null) finalHeaders["x-user-id"] = userId;
	if (body !== undefined) finalHeaders["Content-Type"] = "application/json";

	const baseUrl = import.meta.env.VITE_API_URL ?? "";
	const response = await fetch(`${baseUrl}${path}`, {
		method,
		headers: finalHeaders,
		body: body !== undefined ? JSON.stringify(body) : undefined,
		signal,
	});

	const text = await response.text();
	const parsed: unknown = text.length > 0 ? JSON.parse(text) : null;

	if (!response.ok) {
		throw Object.assign(new Error(`API ${response.status}: ${response.statusText}`), {
			status: response.status,
			body: parsed,
		});
	}

	return parsed as T;
}
