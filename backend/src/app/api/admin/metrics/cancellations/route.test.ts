import { describe, expect, it } from "vitest";
import { adminRequest, jsonRequest } from "@/test/http";
import { GET } from "./route";

describe("GET /api/admin/metrics/cancellations", () => {
  it("el admin ve el conteo por motivo", async () => {
    const res = await GET(adminRequest("GET", "/api/admin/metrics/cancellations"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.reasons).toHaveProperty("presupuesto_alto");
    expect(typeof body.data.total).toBe("number");
  });

  it("rechaza a quien no es admin", async () => {
    const res = await GET(
      jsonRequest("GET", "/api/admin/metrics/cancellations", undefined, { role: "proveedor" }),
    );
    expect(res.status).toBe(403);
  });
});
