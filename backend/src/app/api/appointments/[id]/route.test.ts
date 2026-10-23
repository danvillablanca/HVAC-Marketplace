import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { jsonRequest, withId } from "@/test/http";
import { POST } from "../route";
import { OPTIONS, PATCH } from "./route";

async function createAppointment(): Promise<string> {
  const res = await POST(
    jsonRequest("POST", "/api/appointments", {
      leadId: randomUUID(),
      startsAt: "2026-10-02T10:00:00-03:00",
      durationMinutes: 60,
    }),
  );
  const body = await res.json();
  return body.data.id as string;
}

describe("PATCH /api/appointments/[id]", () => {
  it("actualiza el estado de una cita existente", async () => {
    const id = await createAppointment();
    const res = await PATCH(
      jsonRequest("PATCH", `/api/appointments/${id}`, { status: "confirmada" }),
      withId(id),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toMatchObject({ id, status: "confirmada" });
  });

  it("rechaza un estado inválido", async () => {
    const id = await createAppointment();
    const res = await PATCH(
      jsonRequest("PATCH", `/api/appointments/${id}`, { status: "postergada" }),
      withId(id),
    );

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error.code).toBe("validation_error");
  });

  it("responde 404 si la cita no existe", async () => {
    const res = await PATCH(
      jsonRequest("PATCH", "/api/appointments/missing", { status: "cancelada" }),
      withId(randomUUID()),
    );

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("not_found");
  });

  it("OPTIONS responde 204 con CORS", () => {
    const res = OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:5173");
  });
});
