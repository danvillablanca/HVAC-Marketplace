import { describe, expect, it } from "vitest";
import { jsonRequest, withId } from "@/test/http";
import { POST } from "../route";
import { GET, OPTIONS, PATCH } from "./route";

async function createRequest(): Promise<string> {
  const res = await POST(
    jsonRequest("POST", "/api/requests", {
      equipment: "split",
      description: "Instalación de aire acondicionado split en dormitorio principal",
      urgency: "alta",
      commune: "Providencia",
    }),
  );
  const body = await res.json();
  return body.data.id as string;
}

describe("GET /api/requests/[id]", () => {
  it("obtiene el detalle con cotizaciones y eventos", async () => {
    const id = await createRequest();
    const res = await GET(jsonRequest("GET", `/api/requests/${id}`), withId(id));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.id).toBe(id);
    expect(body.data.status).toBe("abierta");
    expect(Array.isArray(body.data.quotes)).toBe(true);
    expect(Array.isArray(body.data.events)).toBe(true);
  });
});

describe("PATCH /api/requests/[id]", () => {
  it("cancela una solicitud abierta", async () => {
    const id = await createRequest();
    const res = await PATCH(
      jsonRequest("PATCH", `/api/requests/${id}`, { status: "cancelada" }),
      withId(id),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe("cancelada");
  });

  it("OPTIONS responde 204", () => {
    const res = OPTIONS();
    expect(res.status).toBe(204);
  });
});
