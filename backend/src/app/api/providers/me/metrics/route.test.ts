import { describe, expect, it } from "vitest";
import { jsonRequest } from "@/test/http";
import { GET, OPTIONS } from "./route";

describe("GET /api/providers/me/metrics", () => {
  it("responde las métricas del proveedor con el período anterior", async () => {
    const res = await GET(
      jsonRequest("GET", "/api/providers/me/metrics?from=2026-11-01&to=2026-11-13", undefined, {
        role: "proveedor",
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.range).toEqual({ from: "2026-11-01", to: "2026-11-13" });
    expect(body.data.previousRange).toEqual({ from: "2026-10-01", to: "2026-10-13" });
    expect(body.data.current).toHaveProperty("acceptedAmount");
  });

  it("rechaza un rango inválido", async () => {
    const res = await GET(
      jsonRequest("GET", "/api/providers/me/metrics?from=2026-11-13&to=2026-11-01", undefined, {
        role: "proveedor",
      }),
    );
    expect(res.status).toBe(422);
  });

  it("solo proveedores", async () => {
    const res = await GET(jsonRequest("GET", "/api/providers/me/metrics"));
    expect(res.status).toBe(403);
  });

  it("exige sesión", async () => {
    const res = await GET(
      jsonRequest("GET", "/api/providers/me/metrics", undefined, { noAuth: true }),
    );
    expect(res.status).toBe(401);
  });

  it("OPTIONS responde 204", () => {
    expect(OPTIONS().status).toBe(204);
  });
});
