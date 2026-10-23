import type { ApiResponse } from "@hvac/shared";
import { env } from "./env";

export class ApiRequestError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(message: string, code: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  token?: string | null;
}

/**
 * Cliente HTTP tipado contra el backend (Next.js API).
 * Desempaqueta el envelope { ok, data } | { ok, error }.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, signal, token } = options;

  // Modo demo: sin backend. Falla al instante para que cada hook use su fallback demo
  // (evita esperas y el aviso del navegador por acceder a localhost desde un sitio publico).
  if (env.demoMode) {
    throw new ApiRequestError("Modo demo: backend no disponible", "demo_mode", 0);
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload || payload.ok === false) {
    const error = payload && payload.ok === false ? payload.error : undefined;
    throw new ApiRequestError(
      error?.message ?? `Error ${response.status}`,
      error?.code ?? "unknown_error",
      response.status,
      error?.details,
    );
  }

  return payload.data;
}
