import { describe, expect, it } from "vitest";
import { jsonRequest } from "@/test/http";
import { POST as CreateRequest } from "../requests/route";
import { OPTIONS, POST } from "./route";

async function createRequest(): Promise<string> {
  const res = await CreateRequest(
    jsonRequest("POST", "/api/requests", {
      equipment: "chiller",
      description: "Mantenimiento preventivo de chiller industrial, revisión completa",
      urgency: "alta",
      commune: "Santiago",
    }),
  );
  const body = await res.json();
  return body.data.id as string;
}

describe("POST /api/quotes", () => {
  it("crea una cotización y responde 201", async () => {
    const requestId = await createRequest();
    const res = await POST(
      jsonRequest(
        "POST",
        "/api/quotes",
        {
          requestId,
          amount: 250000,
          includesIva: true,
          scope: "Revisión completa del chiller, limpieza de filtros y recarga de gas refrigerante",
          deadlineDays: 5,
          validDays: 15,
        },
        { role: "proveedor" },
      ),
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.amount).toBe(250000);
    expect(body.data.status).toBe("enviada");
  });

  it("rechaza un scope corto", async () => {
    const requestId = await createRequest();
    const res = await POST(
      jsonRequest(
        "POST",
        "/api/quotes",
        {
          requestId,
          amount: 100000,
          scope: "corto",
          deadlineDays: 3,
        },
        { role: "proveedor" },
      ),
    );

    expect(res.status).toBe(422);
  });

  it("rechaza acceso con rol cliente", async () => {
    const requestId = await createRequest();
    const res = await POST(
      jsonRequest(
        "POST",
        "/api/quotes",
        {
          requestId,
          amount: 100000,
          scope: "Alcance suficientemente largo para pasar validación",
          deadlineDays: 3,
        },
        { role: "cliente" },
      ),
    );

    expect(res.status).toBe(403);
  });

  it("OPTIONS responde 204", () => {
    const res = OPTIONS();
    expect(res.status).toBe(204);
  });
});
