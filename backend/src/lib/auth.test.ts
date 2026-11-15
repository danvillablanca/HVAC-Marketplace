import { describe, expect, it } from "vitest";
import { requireUser, requireRole, extractToken } from "./auth";

function makeRequest(token?: string): Request {
  const headers: Record<string, string> = {};
  if (token) headers.authorization = `Bearer ${token}`;
  return new Request("http://localhost/test", { headers });
}

function demoToken(role: string, id = `test-${role}`) {
  return btoa(JSON.stringify({ id, email: `${role}@test.cl`, role }));
}

describe("extractToken", () => {
  it("extrae un Bearer token válido", () => {
    const req = makeRequest("my-token");
    expect(extractToken(req)).toBe("my-token");
  });

  it("devuelve null sin header", () => {
    const req = makeRequest();
    expect(extractToken(req)).toBeNull();
  });
});

describe("requireUser", () => {
  it("rechaza sin token", async () => {
    await expect(requireUser(makeRequest())).rejects.toThrow("Se requiere autenticación");
  });

  it("acepta un token demo válido en modo demo", async () => {
    const token = demoToken("cliente");
    const user = await requireUser(makeRequest(token));
    expect(user.id).toBe("test-cliente");
    expect(user.role).toBe("cliente");
  });

  it("extrae el rol de un token demo admin", async () => {
    const token = demoToken("admin");
    const user = await requireUser(makeRequest(token));
    expect(user.role).toBe("admin");
  });
});

describe("requireRole", () => {
  it("acepta si el rol coincide", async () => {
    const token = demoToken("admin");
    const user = await requireRole(makeRequest(token), ["admin"]);
    expect(user.role).toBe("admin");
  });

  it("rechaza si el rol no coincide", async () => {
    const token = demoToken("cliente");
    await expect(requireRole(makeRequest(token), ["admin"])).rejects.toThrow("Acceso denegado");
  });

  it("acepta múltiples roles permitidos", async () => {
    const token = demoToken("proveedor");
    const user = await requireRole(makeRequest(token), ["proveedor", "admin"]);
    expect(user.role).toBe("proveedor");
  });
});
