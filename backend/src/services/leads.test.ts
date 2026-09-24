import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { leadCreateSchema, leadUpdateSchema } from "@hvac/shared";
import { HttpError } from "../lib/http";
import { createLead, listLeads, updateLead } from "./leads";

const DEMO_CLIENT_ID = "00000000-0000-0000-0000-000000000000";

function makeInput() {
  return leadCreateSchema.parse({
    providerId: randomUUID(),
    description: "Necesito mantención preventiva del equipo",
    urgency: "alta",
    preferredContact: "correo",
  });
}

describe("createLead (fallback demo)", () => {
  it("crea una solicitud en estado nuevo con el cliente demo por defecto", async () => {
    const input = makeInput();
    const lead = await createLead(input);

    expect(lead.providerId).toBe(input.providerId);
    expect(lead.description).toBe(input.description);
    expect(lead.status).toBe("nuevo");
    expect(lead.clientId).toBe(DEMO_CLIENT_ID);
    expect(lead.serviceId).toBeNull();
    expect(lead.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("usa el clientId entregado cuando existe", async () => {
    const input = makeInput();
    const clientId = randomUUID();
    const lead = await createLead(input, clientId);
    expect(lead.clientId).toBe(clientId);
  });

  it("persiste la solicitud para listLeads", async () => {
    const lead = await createLead(makeInput());
    const leads = await listLeads();
    expect(leads.some((item) => item.id === lead.id)).toBe(true);
  });
});

describe("updateLead (fallback demo)", () => {
  it("actualiza el estado de una solicitud existente", async () => {
    const lead = await createLead(makeInput());
    const input = leadUpdateSchema.parse({ status: "contactado" });

    const updated = await updateLead(lead.id, input);

    expect(updated.id).toBe(lead.id);
    expect(updated.status).toBe("contactado");
    expect(updated.description).toBe(lead.description);
  });

  it("lanza HttpError 404 si la solicitud no existe", async () => {
    const input = leadUpdateSchema.parse({ status: "cerrado" });

    const error = await updateLead(randomUUID(), input).catch((err) => err);
    expect(error).toBeInstanceOf(HttpError);
    expect(error.status).toBe(404);
    expect(error.code).toBe("not_found");
  });
});
