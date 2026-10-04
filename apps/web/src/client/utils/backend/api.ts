export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('content-type')) headers.set('content-type', 'application/json');
  headers.set('accept', 'application/json');

  let response: Response;
  try {
    response = await fetch(`/api${path}`, { ...init, headers, credentials: 'same-origin', cache: 'no-store' });
  } catch {
    throw new ApiError('Could not reach the server. Check your connection and try again.', 0);
  }

  const payload = await response.json().catch(() => null) as { message?: string | string[] } | T | null;
  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'message' in payload ? payload.message : null;
    throw new ApiError(Array.isArray(message) ? message.join(' ') : message || `Server request failed (${response.status}).`, response.status);
  }
  return payload as T;
}

export function apiMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'The server request failed. Try again.';
}
