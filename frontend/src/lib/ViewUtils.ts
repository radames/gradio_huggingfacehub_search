import type { JsonValue } from "type-fest";


export type QueryParams = Record<string, string | number | boolean | undefined | string[]>;

/**
 *  Create a query string ("?param=value") from an object {[key]: value}.
 *  Undefined valued are ignored, and an empty string is returned if all values are undefined.
 */
export function queryString(params: QueryParams): string {
	const searchParams = new URLSearchParams();
	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined) {
			if (Array.isArray(value)) {
				for (const val of value) {
					searchParams.append(key, String(val));
				}
			} else {
				searchParams.set(key, String(value));
			}
		}
	}

	const searchParamsStr = searchParams.toString();
	return searchParamsStr ? `?${searchParamsStr}` : "";
}

interface HttpResponseBase<T> {
	/** set to true if the call was aborted by the User */
	aborted?:    boolean;
	/** set to true if the call resulted in an error */
	isError:     boolean;
	/** the parsed server response, whether the call ended up in an error or not */
	payload:     T;
	/** a clone of the raw Response object returned by fetch, in case it is needed for some edge cases */
	rawResponse: Response | undefined;
	/** the request status code */
	statusCode:  number;
	/** Parsed links in Link header */
	links?:      Record<string, string>;
}

interface HttpResponseError<T> extends HttpResponseBase<T> {
	aborted: boolean;
	error:   string;
	isError: true;
}
interface HttpResponseSuccess<T> extends HttpResponseBase<T> {
	isError: false;
	payload: T;
}

export type HttpResponse<SuccessType, ErrorType = unknown> =
	| HttpResponseSuccess<SuccessType>
	| HttpResponseError<ErrorType>;


export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
type ResponseType = "blob" | "json" | "text";

interface SendOptions<D> {
	/** the data sent to the server */
	data?:         D;
	/** the request headers */
	headers?:      Record<string, string>;
	/**
	 * determines how the server response will be parsed (as JSON, text, or a blob)
	 * @default "json"
	 */
	responseType?: ResponseType;
	/**
	 * The AbortSignal interface represents a signal object that allows you to communicate with a
	 * DOM request (such as a fetch request) and abort it if required via an AbortController object.
	 * read more at: https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal
	 */
	signal?:       AbortSignal;
	credentials?:  RequestCredentials;
}


async function getResponseContent(res: Response, type?: ResponseType): Promise<Blob | JsonValue | undefined> {
	try {
		if (res.headers.get("content-type")?.includes("json")) {
			return (await res.json()) as JsonValue;
		}
		if (type === "blob") {
			return await res.blob();
		}
		return await res.text();
	} catch (err) {
		return undefined;
	}
}

/**
 * Handle fetch calls, parse the server response, capture every possible error,
 * and returns standardized {@link HttpResponse} objects in every scenario
 */
export async function httpSend<T, D = Record<string, unknown> | File>(
	method: HttpMethod,
	path: string,
	sendOptions: SendOptions<D> = {}
): Promise<HttpResponse<T>> {
	try {
		const headers = {
			...sendOptions.headers,
			...(sendOptions.responseType === "json"
				? { Accept: "application/json" }
				: sendOptions.responseType === "text"
					? { Accept: "text/plain" }
					: {}),
		};
		const res = await fetch(path, {
			body:
				sendOptions.data instanceof File
					? sendOptions.data
					: sendOptions.data
						? JSON.stringify(sendOptions.data)
						: undefined,
			headers,
			method,
			...(sendOptions.signal ? { signal: sendOptions.signal } : {}),
			...(sendOptions.credentials ? { credentials: sendOptions.credentials } : {}),
		});

		const rawResponse = res.clone();

		if (!res.ok) {
			let error = `${res.status} ${res.statusText}`;

			const payload = await getResponseContent(res);
			// In case we get a detailed JSON error message from the backend - which we should in any of the following cases:
			// - When hitting /api/... endpoints
			// - When using header X-Requested-With: XMLHttpRequest
			// - When using header Content-Type: application/json
			if (typeof payload === "object" && payload) {
				if ("message" in payload && typeof payload.message === "string") {
					error = payload.message;
				} else if ("error" in payload && typeof payload.error === "string") {
					error = payload.error;
				}
			}

			return {
				aborted:    false,
				error,
				isError:    true,
				payload,
				rawResponse,
				statusCode: res.status,
			};
		}

		const payload = await getResponseContent(res, sendOptions.responseType);
		const links = res.headers.get("Link") ? parseLinkHeader(res.headers.get("Link")!) : undefined;
		return payload !== undefined
			? {
				isError:    false,
				payload:    payload as T,
				rawResponse,
				statusCode: res.status,
				links,
			}
			: {
				aborted:    false,
				error:      sendOptions.responseType === "json" ? "Error parsing JSON" : "Error parsing server response",
				isError:    true,
				payload,
				rawResponse,
				statusCode: res.status,
				links,
			};
	} catch (e) {
		return {
			aborted:     e instanceof DOMException && e.name === "AbortError",
			error:       (e instanceof TypeError || e instanceof DOMException) && e.message ? e.message : "Failed to fetch",
			isError:     true,
			payload:     undefined,
			rawResponse: undefined,
			statusCode:  0,
		};
	}
}

type GetOptions = Omit<SendOptions<unknown>, "data">;

/**
 * Helper function to easily and safely make GET calls
 */
export function httpGet<T>(path: string, opts: GetOptions = {}): Promise<HttpResponse<T>> {
	return httpSend<T>("GET", path, { ...opts });
}

export function parseLinkHeader(header: string): Record<string, string> {
	const regex = /<(https?:[/][/][^>]+)>;\s+rel="([^"]+)"/g;

	return Object.fromEntries([...header.matchAll(regex)].map(([_, url, rel]) => [rel, url]));
}


/// A not-that-great throttling function
export function throttle<T extends unknown[]>(callback: (...rest: T) => unknown, limit: number): (...rest: T) => void {
	let last: number;
	/// setTimeout can return different types on browser or node
	let deferTimer: ReturnType<typeof setTimeout>;

	return function (...rest) {
		const now = Date.now();
		if (last && now < last + limit) {
			clearTimeout(deferTimer);
			deferTimer = setTimeout(function () {
				last = now;
				callback(...rest);
			}, limit);
		} else {
			last = now;
			callback(...rest);
		}
	};
}
