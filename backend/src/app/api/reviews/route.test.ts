import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { jsonRequest, rawRequest } from "@/test/http";
import { OPTIONS, POST } from "./route";

describe("POST /api/reviews", () => {
  it("crea una reseña con body válido y responde 201", async () => {
    const providerId = randomUUID();
    const res = await POST(
      jsonRequest("POST", "/api/reviews", { providerId, rating: 5, comment: "Muy buen servicio" }),
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data).toMatchObject({
      providerId,
      rating: 5,
      comment: "Muy buen servicio",
      verified: false,
    });
    expect(body.data.id).toBeTruthy();
  });

  it("rechaza un rating fuera de rango con validation_error", async () => {
    const res = await POST(
      jsonRequest("POST", "/api/reviews", { providerId: randomUUID(), rating: 9, comment: "x" }),
    );

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body).toMatchObject({ ok: false, error: { code: "validation_error" } });
  });

  it("rechaza un cuerpo que no es JSON", async () => {
    const res = await POST(rawRequest("POST", "/api/reviews", "{no-json"));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("invalid_json");
  });

  it("OPTIONS responde 204 con CORS", () => {
    const res = OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:5173");
  });
});
