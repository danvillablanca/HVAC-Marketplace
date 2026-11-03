import { beforeAll, describe, expect, it } from "vitest";
import { SERVICE_CATALOG } from "@hvac/shared";
import type { AuthenticatedUser } from "@/lib/auth";
import { verifiedDemoProvider } from "@/test/providers";
import { listMessages, listThreads, sendMessage } from "./messages";
import { listNotifications } from "./notifications";
import { createQuote, createRequest } from "./requests";

const client: AuthenticatedUser = { id: "chat-cliente", email: "c@test.cl", role: "cliente" };
const intruder: AuthenticatedUser = { id: "chat-intruso", email: "i@test.cl", role: "cliente" };
const provA: AuthenticatedUser = { id: "chat-prov-a", email: "a@test.cl", role: "proveedor" };
const provB: AuthenticatedUser = { id: "chat-prov-b", email: "b@test.cl", role: "proveedor" };
const provC: AuthenticatedUser = { id: "chat-prov-c", email: "x@test.cl", role: "proveedor" };
let requestId = "";
let providerA = "";
let providerB = "";

beforeAll(async () => {
  providerA = (
    await verifiedDemoProvider(provA.id, { commune: "Providencia", legalName: "Chat A SpA" })
  ).id;
  providerB = (await verifiedDemoProvider(provB.id, { commune: "Ñuñoa", legalName: "Chat B SpA" }))
    .id;
  await verifiedDemoProvider(provC.id, { commune: "Macul" });
  const r = await createRequest(
    {
      serviceId: SERVICE_CATALOG[1].id,
      equipment: "split",
      description: "Necesito instalar un split en el living del departamento",
      urgency: "media",
      commune: "Ñuñoa",
      photos: [],
    },
    client.id,
  );
  requestId = r.id;
  const quote = {
    requestId,
    amount: 90000,
    includesIva: true,
    scope: "Instalación completa con materiales y garantía",
    deadlineDays: 3,
    validDays: 10,
  };
  await createQuote(quote, provA);
  await createQuote(quote, provB);
});

describe("PR-028 MSG-01 chat por solicitud y proveedor", () => {
  it("el chat se habilita desde la primera cotización: sin cotizar no hay acceso", async () => {
    await expect(sendMessage(requestId, provC, "Hola")).rejects.toMatchObject({ status: 403 });
    await expect(listMessages(requestId, intruder, providerA)).rejects.toMatchObject({
      status: 403,
    });
  });

  it("cliente y proveedor conversan; el historial persiste y notifica al otro", async () => {
    await sendMessage(requestId, client, "¿Incluye el retiro del equipo antiguo?", providerA);
    await sendMessage(requestId, provA, "Sí, lo retiramos sin costo adicional.");

    const seenByProvider = await listMessages(requestId, provA);
    expect(seenByProvider.map((m) => [m.body, m.mine])).toEqual([
      ["¿Incluye el retiro del equipo antiguo?", false],
      ["Sí, lo retiramos sin costo adicional.", true],
    ]);
    const notified = await listNotifications(provA.id);
    expect(notified.some((n) => n.type === "nuevo_mensaje" && n.refId === requestId)).toBe(true);
  });

  it("cada proveedor solo ve su propio hilo", async () => {
    await sendMessage(requestId, client, "Mensaje solo para B", providerB);
    const forA = await listMessages(requestId, provA);
    expect(forA.some((m) => m.body === "Mensaje solo para B")).toBe(false);
    const threadsA = await listThreads(requestId, provA);
    expect(threadsA.map((t) => t.providerId)).toEqual([providerA]);
  });

  it("el cliente ve un hilo por proveedor con no leídos que se limpian al abrirlo", async () => {
    await sendMessage(requestId, provB, "Puedo ir mañana a las 10:00");
    const threads = await listThreads(requestId, client);
    expect(threads.map((t) => t.providerId).sort()).toEqual([providerA, providerB].sort());
    expect(threads.find((t) => t.providerId === providerB)?.unread).toBe(1);
    await listMessages(requestId, client, providerB);
    const after = await listThreads(requestId, client);
    expect(after.find((t) => t.providerId === providerB)?.unread).toBe(0);
  });

  it("el cliente no puede escribir a un proveedor que no cotizó", async () => {
    await expect(sendMessage(requestId, client, "Hola", "no-existe")).rejects.toMatchObject({
      status: 404,
    });
  });
});
