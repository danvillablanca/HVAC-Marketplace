import { beforeEach, describe, expect, it, vi } from "vitest";

const signInWithPassword = vi.fn();
vi.mock("../lib/supabase", () => ({
  getAnonClient: () => ({ auth: { signInWithPassword } }),
  getServiceClient: () => null,
}));

const { login, lockoutMinutesLeft, resetMemoryAttempts, INVALID_CREDENTIALS, LOCKOUT_WINDOW_MS } =
  await import("./auth-login");

const ok = {
  data: { session: { access_token: "a", refresh_token: "r", expires_at: 1 } },
  error: null,
};
const bad = { data: { session: null }, error: { message: "Invalid login credentials" } };

describe("auth-login", () => {
  beforeEach(() => {
    resetMemoryAttempts();
    signInWithPassword.mockReset();
  });

  it("PR-002 devuelve la sesión con credenciales válidas", async () => {
    signInWithPassword.mockResolvedValue(ok);
    await expect(login("Cliente@Demo.cl", "demo1234")).resolves.toEqual({
      accessToken: "a",
      refreshToken: "r",
      expiresAt: 1,
    });
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "cliente@demo.cl",
      password: "demo1234",
    });
  });

  it("PR-002 usa un mensaje genérico ante credenciales inválidas", async () => {
    signInWithPassword.mockResolvedValue(bad);
    await expect(login("x@test.cl", "mala1234")).rejects.toMatchObject({
      status: 401,
      message: INVALID_CREDENTIALS,
    });
  });

  it("PR-002 bloquea tras 5 intentos fallidos aunque la clave sea correcta", async () => {
    signInWithPassword.mockResolvedValue(bad);
    for (let i = 0; i < 5; i++) await expect(login("y@test.cl", "mala1234")).rejects.toThrow();
    signInWithPassword.mockResolvedValue(ok);
    await expect(login("y@test.cl", "buena1234")).rejects.toMatchObject({ status: 429 });
    expect(signInWithPassword).toHaveBeenCalledTimes(5);
  });

  it("el bloqueo es por correo", async () => {
    signInWithPassword.mockResolvedValue(bad);
    for (let i = 0; i < 5; i++) await expect(login("z@test.cl", "mala1234")).rejects.toThrow();
    signInWithPassword.mockResolvedValue(ok);
    await expect(login("otro@test.cl", "buena1234")).resolves.toBeTruthy();
  });

  it("lockoutMinutesLeft ignora fallos anteriores a un ingreso exitoso y vence a los 15 min", () => {
    const now = Date.now();
    const fail = (msAgo: number) => ({ success: false, createdAt: now - msAgo });
    const fiveFails = [1, 2, 3, 4, 5].map((m) => fail(m * 60000));
    expect(lockoutMinutesLeft(fiveFails, now)).toBe(10);
    expect(
      lockoutMinutesLeft([...fiveFails.slice(0, 4), { success: true, createdAt: now - 1000 }], now),
    ).toBe(0);
    expect(lockoutMinutesLeft(fiveFails.slice(0, 4), now)).toBe(0);
    expect(
      lockoutMinutesLeft([fail(LOCKOUT_WINDOW_MS - 30000), ...fiveFails.slice(0, 4)], now),
    ).toBe(1);
  });

  it("informa cuando falta confirmar el correo (Supabase Cloud)", async () => {
    signInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { code: "email_not_confirmed", message: "Email not confirmed" },
    });
    await expect(login("nuevo@test.cl", "clave1234")).rejects.toMatchObject({
      status: 403,
      code: "email_not_confirmed",
    });
  });
});
