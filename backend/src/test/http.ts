/**
 * Utilidades para invocar Route Handlers de Next (App Router) como funciones,
 * pasando Request/Response web estándar.
 */

/** Token demo para tests: codifica un usuario demo en base64. */
function demoToken(
  role: "cliente" | "proveedor" | "admin" = "cliente",
  id = `test-${role}`,
): string {
  return btoa(JSON.stringify({ id, email: `${role}@test.cl`, role }));
}

export function jsonRequest(
  method: string,
  path: string,
  body?: unknown,
  options?: { role?: "cliente" | "proveedor" | "admin"; noAuth?: boolean },
): Request {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  if (!options?.noAuth) {
    headers.authorization = `Bearer ${demoToken(options?.role ?? "cliente")}`;
  }
  return new Request(`http://localhost${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function rawRequest(method: string, path: string, body: string): Request {
  return new Request(`http://localhost${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${demoToken()}`,
    },
    body,
  });
}

export function adminRequest(method: string, path: string, body?: unknown): Request {
  return jsonRequest(method, path, body, { role: "admin" });
}

export function withId(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}
