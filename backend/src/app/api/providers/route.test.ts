import { describe, expect, it } from "vitest";
import { jsonRequest } from "@/test/http";
import { GET, OPTIONS } from "./route";

describe("GET /api/providers", () => {
  it("devuelve el listado paginado", async () => {
    const res = await GET(jsonRequest("GET", "/api/providers?limit=3&offset=0"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toMatchObject({ total: 10, limit: 3, offset: 0 });
    expect(body.data.items).toHaveLength(3);
  });

  it("pagina con offset sin repetir resultados", async () => {
    const [first, second] = await Promise.all([
      GET(jsonRequest("GET", "/api/providers?limit=3&offset=0")).then((res) => res.json()),
      GET(jsonRequest("GET", "/api/providers?limit=3&offset=3")).then((res) => res.json()),
    ]);
    const firstIds = first.data.items.map((provider: { id: string }) => provider.id);
    const secondIds = second.data.items.map((provider: { id: string }) => provider.id);

    expect(new Set([...firstIds, ...secondIds]).size).toBe(6);
  });

  it("filtra por segmento", async () => {
    const res = await GET(jsonRequest("GET", "/api/providers?segment=industrial"));
    const body = await res.json();

    expect(body.data.total).toBe(3);
    for (const provider of body.data.items) {
      expect(provider.segment).toBe("industrial");
    }
  });

  it("rechaza un segmento inválido", async () => {
    const res = await GET(jsonRequest("GET", "/api/providers?segment=espacial"));

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error.code).toBe("validation_error");
  });

  it("OPTIONS responde 204 con CORS", () => {
    const res = OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:5173");
  });
});
