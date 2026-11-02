import { describe, expect, it } from "vitest";
import { jsonRequest } from "@/test/http";
import { GET, OPTIONS, POST } from "./route";

function validRequestBody() {
  return {
    equipment: "split",
    description: "Necesito instalación de aire acondicionado split en living comedor",
    urgency: "media",
    commune: "Las Condes",
    region: "Metropolitana",
  };
}

describe("GET /api/requests", () => {
  it("lista solicitudes del usuario autenticado", async () => {
    // Crear una primero
    await POST(jsonRequest("POST", "/api/requests", validRequestBody()));

    const res = await GET(jsonRequest("GET", "/api/requests"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it("rechaza sin autenticación", async () => {
    const res = await GET(jsonRequest("GET", "/api/requests", undefined, { noAuth: true }));
    expect(res.status).toBe(401);
  });
});

describe("POST /api/requests", () => {
  it("crea una solicitud y responde 201", async () => {
    const payload = validRequestBody();
    const res = await POST(jsonRequest("POST", "/api/requests", payload));

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data).toMatchObject({
      equipment: "split",
      description: payload.description,
      urgency: "media",
      status: "abierta",
      commune: "Las Condes",
    });
    expect(body.data.id).toBeTruthy();
  });

  it("rechaza descripción corta", async () => {
    const res = await POST(
      jsonRequest("POST", "/api/requests", { ...validRequestBody(), description: "corto" }),
    );
    expect(res.status).toBe(422);
  });

  it("OPTIONS responde 204 con CORS", () => {
    const res = OPTIONS();
    expect(res.status).toBe(204);
  });
});
