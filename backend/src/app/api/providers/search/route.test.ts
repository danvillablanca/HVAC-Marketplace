import { describe, expect, it } from "vitest";
import { jsonRequest } from "@/test/http";
import { GET, OPTIONS } from "./route";

const VALID_QUERY = "/api/providers/search?lat=-33.44&lng=-70.66&radiusKm=30";

describe("GET /api/providers/search", () => {
  it("devuelve un array de proveedores con location para una query válida", async () => {
    const res = await GET(jsonRequest("GET", VALID_QUERY));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    for (const provider of body.data) {
      expect(provider.location).toMatchObject({
        lat: expect.any(Number),
        lng: expect.any(Number),
      });
    }
  });

  it("ordena los resultados por distancia ascendente", async () => {
    const res = await GET(jsonRequest("GET", VALID_QUERY));
    const body = await res.json();
    const distances = body.data.map(
      (provider: { distanceMeters: number }) => provider.distanceMeters,
    );

    expect(distances).toEqual([...distances].sort((a: number, b: number) => a - b));
  });

  it("filtra por segmento", async () => {
    const res = await GET(jsonRequest("GET", `${VALID_QUERY}&segment=residencial`));
    const body = await res.json();

    expect(body.data.length).toBeGreaterThan(0);
    for (const provider of body.data) {
      expect(provider.segment).toBe("residencial");
    }
  });

  it("responde 422 validation_error si lat está fuera de rango", async () => {
    const res = await GET(jsonRequest("GET", "/api/providers/search?lat=0&lng=-70.66"));

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body).toMatchObject({ ok: false, error: { code: "validation_error" } });
  });

  it("OPTIONS responde 204 con Access-Control-Allow-Origin", () => {
    const res = OPTIONS();

    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:5173");
  });
});
