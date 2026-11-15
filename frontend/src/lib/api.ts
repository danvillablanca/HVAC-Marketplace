import type { ApiResponse } from "@hvac/shared";
import { env, isDemoMode } from "./env";
import { getSupabase } from "./supabase";

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
 * Obtiene el token de sesión actual de Supabase Auth.
 * En modo demo sin Supabase, genera un token demo codificado en base64.
 */
async function getSessionToken(): Promise<string | null> {
  const supabase = getSupabase();
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }
  if (isDemoMode) {
    // En modo demo, codificar la sesión localStorage como token
    const SESSION_KEY = "hvac-auth-session";
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (raw) return btoa(raw);
    } catch {
      // ignore
    }
  }
  return null;
}

/**
 * Cliente HTTP tipado contra el backend (Next.js API).
 * Desempaqueta el envelope { ok, data } | { ok, error }.
 * Inyecta automáticamente el token de sesión en el header Authorization.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, signal, token: explicitToken } = options;

  // Usar token explícito si se proporciona, o buscar el de la sesión
  const token = explicitToken !== undefined ? explicitToken : await getSessionToken();

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
