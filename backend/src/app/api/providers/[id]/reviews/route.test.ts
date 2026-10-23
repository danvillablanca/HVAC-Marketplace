import { describe, expect, it } from "vitest";
import { jsonRequest, withId } from "@/test/http";
import { GET, OPTIONS } from "./route";

describe("GET /api/providers/[id]/reviews", () => {
  it("devuelve las reseñas de un proveedor existente", async () => {
    const res = await GET(
      jsonRequest("GET", "/api/providers/p-clima-andes/reviews"),
      withId("p-clima-andes"),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(2);
    for (const review of body.data) {
      expect(review.providerId).toBe("p-clima-andes");
    }
  });

  it("devuelve un array vacío para un proveedor sin reseñas", async () => {
    const res = await GET(
      jsonRequest("GET", "/api/providers/p-solar-verde/reviews"),
      withId("p-solar-verde"),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, data: [] });
  });

  it("OPTIONS responde 204 con CORS", () => {
    const res = OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:5173");
  });
});
