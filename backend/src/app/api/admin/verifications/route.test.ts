import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { demoProviders } from "@/data/demo";
import { adminRequest, jsonRequest } from "@/test/http";
import { GET, OPTIONS, PATCH } from "./route";

describe("GET /api/admin/verifications", () => {
  it("lista los proveedores pendientes o en revisión", async () => {
    const res = await GET(adminRequest("GET", "/api/admin/verifications"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    for (const provider of body.data) {
      expect(["pendiente", "en_revision"]).toContain(provider.verificationStatus);
    }
  });

  it("rechaza acceso sin rol admin", async () => {
    const res = await GET(jsonRequest("GET", "/api/admin/verifications"));
    expect(res.status).toBe(403);
  });

  it("rechaza sin autenticación", async () => {
    const res = await GET(
      jsonRequest("GET", "/api/admin/verifications", undefined, { noAuth: true }),
    );
    expect(res.status).toBe(401);
  });
});

describe("PATCH /api/admin/verifications", () => {
  it("aplica una decisión válida sobre un proveedor", async () => {
    const fixtureId = randomUUID();
    const template = demoProviders[0];
    demoProviders.push({
      ...template,
      id: fixtureId,
      slug: `fixture-${fixtureId}`,
      verificationStatus: "pendiente",
    });

    try {
      const res = await PATCH(
        adminRequest("PATCH", "/api/admin/verifications", {
          providerId: fixtureId,
          decision: "verificado",
          note: "Documentación correcta",
        }),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toEqual({ providerId: fixtureId, status: "verificado" });
    } finally {
      demoProviders.pop();
    }
  });

  it("rechaza una decisión inválida", async () => {
    const res = await PATCH(
      adminRequest("PATCH", "/api/admin/verifications", {
        providerId: randomUUID(),
        decision: "quizas",
      }),
    );

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error.code).toBe("validation_error");
  });

  it("rechaza acceso sin rol admin", async () => {
    const res = await PATCH(
      jsonRequest("PATCH", "/api/admin/verifications", {
        providerId: randomUUID(),
        decision: "verificado",
      }),
    );
    expect(res.status).toBe(403);
  });

  it("OPTIONS responde 204 con CORS", () => {
    const res = OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:5173");
  });
});

describe("PR-014 aprobacion en modo demo (ids no UUID)", () => {
  it("el admin aprueba un proveedor demo con id tipo slug", async () => {
    const res = await PATCH(
      adminRequest("PATCH", "/api/admin/verifications", {
        providerId: "p-calor-central",
        decision: "verificado",
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe("verificado");
  });
});

