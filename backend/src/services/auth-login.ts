import { getAnonClient, getServiceClient } from "../lib/supabase";
import { HttpError } from "../lib/http";

/** REQ-AUT-02: 5 intentos fallidos en 15 minutos bloquean el correo temporalmente. */
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;

/** Mensaje genérico: no revela si el correo existe. */
export const INVALID_CREDENTIALS = "Correo o contraseña incorrectos.";

export interface LoginSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number | null;
}

interface Attempt {
  success: boolean;
  createdAt: number;
}

// Respaldo en memoria cuando no hay service role (tests y desarrollo sin base de datos).
const memoryAttempts = new Map<string, Attempt[]>();

async function recentAttempts(email: string, since: number): Promise<Attempt[]> {
  const db = getServiceClient();
  if (!db) return (memoryAttempts.get(email) ?? []).filter((a) => a.createdAt >= since);
  const { data, error } = await db
    .from("login_attempts")
    .select("success, created_at")
    .eq("email", email)
    .gte("created_at", new Date(since).toISOString())
    .order("created_at", { ascending: false });
  if (error) throw new HttpError("db_error", "No se pudo validar el inicio de sesión", 502);
  return (data ?? []).map((row: { success: boolean; created_at: string }) => ({
    success: row.success,
    createdAt: Date.parse(row.created_at),
  }));
}

async function recordAttempt(email: string, success: boolean): Promise<void> {
  const db = getServiceClient();
  if (!db) {
    memoryAttempts.set(email, [...(memoryAttempts.get(email) ?? []), { success, createdAt: Date.now() }]);
    return;
  }
  await db.from("login_attempts").insert({ email, success });
}

/**
 * Minutos que faltan para que se levante el bloqueo, o 0 si no está bloqueado.
 * Solo cuentan los fallos posteriores al último ingreso exitoso de la ventana.
 */
export function lockoutMinutesLeft(attempts: Attempt[], now: number): number {
  const sorted = [...attempts].sort((a, b) => b.createdAt - a.createdAt);
  const failures: Attempt[] = [];
  for (const attempt of sorted) {
    if (attempt.success) break;
    failures.push(attempt);
  }
  if (failures.length < MAX_FAILED_ATTEMPTS) return 0;
  const oldestCounted = failures[MAX_FAILED_ATTEMPTS - 1].createdAt;
  return Math.max(1, Math.ceil((oldestCounted + LOCKOUT_WINDOW_MS - now) / 60000));
}

export async function login(rawEmail: string, password: string): Promise<LoginSession> {
  const auth = getAnonClient();
  if (!auth) {
    throw new HttpError("service_unavailable", "El servicio de autenticación no está disponible.", 503);
  }
  const email = rawEmail.trim().toLowerCase();
  const now = Date.now();

  const minutes = lockoutMinutesLeft(await recentAttempts(email, now - LOCKOUT_WINDOW_MS), now);
  if (minutes > 0) {
    throw new HttpError(
      "too_many_attempts",
      `Demasiados intentos fallidos. Intenta de nuevo en ${minutes} minuto${minutes === 1 ? "" : "s"}.`,
      429,
    );
  }

  const { data, error } = await auth.auth.signInWithPassword({ email, password });
  if (error || !data?.session) {
    await recordAttempt(email, false);
    throw new HttpError("invalid_credentials", INVALID_CREDENTIALS, 401);
  }

  await recordAttempt(email, true);
  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresAt: data.session.expires_at ?? null,
  };
}

/** Solo para tests. */
export function resetMemoryAttempts(): void {
  memoryAttempts.clear();
}
