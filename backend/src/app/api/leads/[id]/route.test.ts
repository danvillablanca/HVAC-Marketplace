import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { jsonRequest, withId } from "@/test/http";
import { POST } from "../route";
import { OPTIONS, PATCH } from "./route";

async function createLead(): Promise<string> {
  const res = await POST(
    jsonRequest("POST", "/api/leads", {
      providerId: randomUUID(),
      description: "Instalación de aire acondicionado",
      urgency: "media",
      preferredContact: "whatsapp",
    }),
  );
  const body = await res.json();
  return body.data.id as string;
}

describe("PATCH /api/leads/[id]", () => {
  it("actualiza el estado de una solicitud existente", async () => {
    const id = await createLead();
    const res = await PATCH(
      jsonRequest("PATCH", `/api/leads/${id}`, { status: "contactado", note: "Llamado" }),
      withId(id),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toMatchObject({ id, status: "contactado" });
  });

  it("rechaza un estado inválido", async () => {
    const id = await createLead();
    const res = await PATCH(
      jsonRequest("PATCH", `/api/leads/${id}`, { status: "existe" }),
      withId(id),
    );

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error.code).toBe("validation_error");
  });

  it("responde 404 si la solicitud no existe", async () => {
    const res = await PATCH(
      jsonRequest("PATCH", "/api/leads/missing", { status: "cerrado" }),
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
