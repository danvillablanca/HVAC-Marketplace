import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { jsonRequest } from "@/test/http";
import { GET, OPTIONS, POST } from "./route";

function validLeadBody() {
  return {
    providerId: randomUUID(),
    description: "Necesito mantención de un equipo split",
    urgency: "alta",
    preferredContact: "correo",
  };
}

describe("GET /api/leads", () => {
  it("lista las solicitudes existentes", async () => {
    const created = await POST(jsonRequest("POST", "/api/leads", validLeadBody())).then((res) =>
      res.json(),
    );

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.some((lead: { id: string }) => lead.id === created.data.id)).toBe(true);
  });
});

describe("POST /api/leads", () => {
  it("crea una solicitud y responde 201", async () => {
    const payload = validLeadBody();
    const res = await POST(jsonRequest("POST", "/api/leads", payload));

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data).toMatchObject({
      providerId: payload.providerId,
      description: payload.description,
      status: "nuevo",
    });
    expect(body.data.id).toBeTruthy();
  });

  it("rechaza una descripción demasiado corta", async () => {
    const res = await POST(
      jsonRequest("POST", "/api/leads", { providerId: randomUUID(), description: "corto" }),
    );

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
