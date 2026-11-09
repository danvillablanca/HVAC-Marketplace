import {
  LOGIN_LOCKOUT_WINDOW_MS,
  lockoutMessage,
  lockoutMinutesLeft,
  type LoginAttempt,
} from "@hvac/shared";
import { getAnonClient, getServiceClient } from "../lib/supabase";
import { HttpError } from "../lib/http";

export { lockoutMinutesLeft } from "@hvac/shared";
export const LOCKOUT_WINDOW_MS = LOGIN_LOCKOUT_WINDOW_MS;

/** Mensaje genérico: no revela si el correo existe. */
export const INVALID_CREDENTIALS = "Correo o contraseña incorrectos.";

export interface LoginSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number | null;
}

type Attempt = LoginAttempt;

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
    memoryAttempts.set(email, [
      ...(memoryAttempts.get(email) ?? []),
      { success, createdAt: Date.now() },
    ]);
    return;
  }
  await db.from("login_attempts").insert({ email, success });
}

export async function login(rawEmail: string, password: string): Promise<LoginSession> {
  const auth = getAnonClient();
  if (!auth) {
    throw new HttpError(
      "service_unavailable",
      "El servicio de autenticación no está disponible.",
      503,
    );
  }
  const email = rawEmail.trim().toLowerCase();
  const now = Date.now();

  const minutes = lockoutMinutesLeft(await recentAttempts(email, now - LOCKOUT_WINDOW_MS), now);
  if (minutes > 0) {
    throw new HttpError("too_many_attempts", lockoutMessage(minutes), 429);
  }

  const { data, error } = await auth.auth.signInWithPassword({ email, password });
  // Supabase Cloud exige confirmar el correo: se informa en vez del mensaje generico.
  if (error?.code === "email_not_confirmed") {
    throw new HttpError(
      "email_not_confirmed",
      "Confirma tu correo antes de ingresar: revisa el enlace que te enviamos.",
      403,
    );
  }
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
