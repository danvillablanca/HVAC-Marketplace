import { describe, expect, it } from "vitest";
import { GET, OPTIONS } from "./route";

describe("GET /api/health", () => {
  it("responde 200 con el estado del servicio y sin Supabase", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      ok: true,
      data: { status: "ok", supabase: false },
    });
  });
});

describe("OPTIONS /api/health", () => {
  it("responde 204 con cabeceras CORS", () => {
    const res = OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:5173");
    expect(res.headers.get("Access-Control-Allow-Methods")).toContain("GET");
  });
});
