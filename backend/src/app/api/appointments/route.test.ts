import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { jsonRequest } from "@/test/http";
import { OPTIONS, POST } from "./route";

describe("POST /api/appointments", () => {
  it("agenda una visita y responde 201", async () => {
    const leadId = randomUUID();
    const res = await POST(
      jsonRequest("POST", "/api/appointments", {
        leadId,
        startsAt: "2026-10-01T15:00:00-03:00",
        durationMinutes: 90,
      }),
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data).toMatchObject({
      leadId,
      startsAt: "2026-10-01T15:00:00-03:00",
      status: "propuesta",
    });
    expect(body.data.id).toBeTruthy();
  });

  it("rechaza un startsAt sin zona horaria", async () => {
    const res = await POST(
      jsonRequest("POST", "/api/appointments", {
        leadId: randomUUID(),
        startsAt: "2026-10-01T15:00:00",
      }),
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
