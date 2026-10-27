import { API_URL, REQUEST_TIMEOUT_MS } from '../config/env';

export class ApiError extends Error {
    constructor(public status: number, message: string, public body: string | null = null) {
        super(message);
    }
}

type Query = Record<string, string | number | boolean | undefined>;

function buildUrl(path: string, query?: Query) {
    const qs = query
        ? Object.entries(query)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
            .join('&')
        : '';
    return `${API_URL}${path}${qs ? `?${qs}` : ''}`;
}

async function request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    opts: { body?: unknown; query?: Query; headers?: Record<string, string> } = {}
): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS || 10000);
    let res: Response;

    const isFormData = typeof FormData !== 'undefined' && opts.body instanceof FormData;

    // Garante que o header Content-Type nunca é injetado manualmente quando for FormData
    const customHeaders = { ...(opts.headers || {}) };
    if (isFormData) {
        delete customHeaders['Content-Type'];
        delete customHeaders['content-type'];
    }

    const defaultHeaders: Record<string, string> = isFormData
        ? { Accept: 'application/json' }
        : { 'Content-Type': 'application/json', Accept: 'application/json' };

    try {
        res = await fetch(buildUrl(path, opts.query), {
            method,
            headers: { ...defaultHeaders, ...customHeaders },
            body: isFormData
                ? (opts.body as FormData)
                : opts.body !== undefined
                    ? JSON.stringify(opts.body)
                    : undefined,
            signal: controller.signal,
        });
    } catch (err) {
        console.error('Erro na requisição Fetch:', err);
        throw new ApiError(0, 'Não foi possível conectar ao servidor. Verifique sua conexão.');
    } finally {
        clearTimeout(timer);
    }

    const text = await res.text();

    if (!res.ok) {
        throw new ApiError(
            res.status,
            res.status >= 500 ? 'Erro no servidor. Tente novamente.' : 'Requisição inválida.',
            text || null
        );
    }

    if (!text) return undefined as T;

    try {
        return JSON.parse(text) as T;
    } catch {
        return text as unknown as T;
    }
}

export const api = {
    get: <T>(p: string, query?: Query) => request<T>('GET', p, { query }),
    post: <T>(p: string, body?: unknown, query?: Query, headers?: Record<string, string>) =>
        request<T>('POST', p, { body, query, headers }),
    put: <T>(p: string, body?: unknown) => request<T>('PUT', p, { body }),
    patch: <T>(p: string, body?: unknown, query?: Query) => request<T>('PATCH', p, { body, query }),
    delete: <T = void>(p: string) => request<T>('DELETE', p),
};