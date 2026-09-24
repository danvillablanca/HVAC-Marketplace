import { describe, expect, it } from "vitest";
import { jsonRequest, withId } from "@/test/http";
import { GET, OPTIONS } from "./route";

describe("GET /api/providers/[id]", () => {
  it("devuelve el detalle de un proveedor demo existente", async () => {
    const res = await GET(
      jsonRequest("GET", "/api/providers/p-clima-andes"),
      withId("p-clima-andes"),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toMatchObject({
      id: "p-clima-andes",
      legalName: "Clima Andes SpA",
      isDemo: true,
    });
    expect(body.data.location).toMatchObject({
      lat: expect.any(Number),
      lng: expect.any(Number),
    });
    expect(body.data.servicesDetailed.length).toBeGreaterThan(0);
  });

  it("responde 404 not_found si el proveedor no existe", async () => {
    const res = await GET(jsonRequest("GET", "/api/providers/no-existe"), withId("no-existe"));

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toMatchObject({ ok: false, error: { code: "not_found" } });
  });

  it("OPTIONS responde 204 con CORS", () => {
    const res = OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:5173");
  });
});
