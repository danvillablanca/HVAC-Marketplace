/**
 * Utilidades para invocar Route Handlers de Next (App Router) como funciones,
 * pasando Request/Response web estándar.
 */

export function jsonRequest(method: string, path: string, body?: unknown): Request {
  const headers = body === undefined ? undefined : { "content-type": "application/json" };
  return new Request(`http://localhost${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function rawRequest(method: string, path: string, body: string): Request {
  return new Request(`http://localhost${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body,
  });
}

export function withId(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}
