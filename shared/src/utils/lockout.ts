/** REQ-AUT-02: 5 intentos fallidos en 15 minutos bloquean el correo temporalmente. */
export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCKOUT_WINDOW_MS = 15 * 60 * 1000;

export interface LoginAttempt {
  success: boolean;
  createdAt: number;
}

/**
 * Minutos que faltan para levantar el bloqueo, o 0 si no hay bloqueo.
 * Solo cuentan los fallos de la ventana posteriores al ultimo ingreso exitoso.
 */
export function lockoutMinutesLeft(attempts: LoginAttempt[], now: number): number {
  const sorted = attempts
    .filter((a) => a.createdAt >= now - LOGIN_LOCKOUT_WINDOW_MS)
    .sort((a, b) => b.createdAt - a.createdAt);
  const failures: LoginAttempt[] = [];
  for (const attempt of sorted) {
    if (attempt.success) break;
    failures.push(attempt);
  }
  if (failures.length < MAX_FAILED_LOGIN_ATTEMPTS) return 0;
  const oldestCounted = failures[MAX_FAILED_LOGIN_ATTEMPTS - 1].createdAt;
  return Math.max(1, Math.ceil((oldestCounted + LOGIN_LOCKOUT_WINDOW_MS - now) / 60000));
}

export function lockoutMessage(minutes: number): string {
  return `Demasiados intentos fallidos. Intenta de nuevo en ${minutes} minuto${minutes === 1 ? "" : "s"}.`;
}
