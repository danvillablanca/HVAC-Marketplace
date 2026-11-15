import { beforeAll, describe, expect, it } from "vitest";
import { SERVICE_CATALOG } from "@hvac/shared";
import type { AuthenticatedUser } from "@/lib/auth";
import { verifiedDemoProvider } from "@/test/providers";
import { saveMyProfile } from "./provider-profile";
import { listNotifications } from "./notifications";
import {
  AUTO_CONFIRM_DAYS,
  confirmCompletion,
  createQuote,
  createRequest,
  decideQuote,
  getRequestDetail,
  listRequests,
  transitionRequest,
} from "./requests";

const client: AuthenticatedUser = { id: "flow-cliente", email: "c@test.cl", role: "cliente" };
const otherClient: AuthenticatedUser = {
  id: "flow-cliente-2",
  email: "c2@test.cl",
  role: "cliente",
};
const near: AuthenticatedUser = { id: "flow-prov-cerca", email: "p1@test.cl", role: "proveedor" };
const near2: AuthenticatedUser = {
  id: "flow-prov-cerca-2",
  email: "p2@test.cl",
  role: "proveedor",
};
const far: AuthenticatedUser = { id: "flow-prov-lejos", email: "p3@test.cl", role: "proveedor" };
const unverified: AuthenticatedUser = {
  id: "flow-prov-sin-verificar",
  email: "p4@test.cl",
  role: "proveedor",
};

const SPLIT = SERVICE_CATALOG[1].id;
const quoteInput = (requestId: string, amount = 90000) => ({
  requestId,
  amount,
  includesIva: true,
  scope: "Instalación completa del equipo con materiales y garantía",
  deadlineDays: 3,
  validDays: 10,
});

async function newRequest(by = client, extra: Record<string, unknown> = {}) {
  return createRequest(
    {
      serviceId: SPLIT,
      equipment: "split",
      description: "Instalar un split de 12.000 BTU en el living del departamento",
      urgency: "alta",
      commune: "Ñuñoa",
      photos: [],
      ...extra,
    },
    by.id,
  );
}

beforeAll(async () => {
  await verifiedDemoProvider(near.id, { commune: "Providencia", coverageRadiusKm: 15 });
  await verifiedDemoProvider(near2.id, { commune: "Macul", coverageRadiusKm: 15 });
  // Valparaíso queda a ~100 km de Ñuñoa: fuera de cobertura.
  await verifiedDemoProvider(far.id, { commune: "Valparaíso", coverageRadiusKm: 20 });
  await saveMyProfile(unverified.id, {
    legalName: "Sin Verificar SpA",
    rut: "761234560",
    segment: "residencial",
    description: "",
    phone: "+56911112222",
    email: "sv@test.cl",
    yearsExperience: null,
    website: "",
    commune: "Ñuñoa",
    address: "",
    coverageRadiusKm: 30,
    isAvailable: true,
    weeklyHours: {},
    modalities: [],
    services: [{ serviceId: SPLIT }],
  });
});

describe("PR-020/021 creación y distribución (RN-03)", () => {
  it("ubica la solicitud por comuna y notifica solo a proveedores elegibles", async () => {
    const r = await newRequest();
    expect(r.status).toBe("abierta");
    expect(r.region).toBe("Metropolitana de Santiago");
    const notified = async (u: AuthenticatedUser) =>
      (await listNotifications(u.id)).some((n) => n.type === "nueva_solicitud" && n.refId === r.id);
    expect(await notified(near)).toBe(true);
    expect(await notified(far)).toBe(false);
    expect(await notified(unverified)).toBe(false);
  });

  it("no ofrece la solicitud a quien no presta el servicio", async () => {
    const onlySolar = { id: "flow-prov-solar", email: "s@test.cl", role: "proveedor" as const };
    await verifiedDemoProvider(onlySolar.id, {
      commune: "Ñuñoa",
      services: [{ serviceId: SERVICE_CATALOG[4].id }],
    });
    const r = await newRequest();
    expect((await listRequests(onlySolar)).some((x) => x.id === r.id)).toBe(false);
  });
});

describe("PR-022 bandeja del proveedor (SOL-03)", () => {
  it("muestra solo elegibles, con comuna y distancia aproximada, sin dirección ni cliente", async () => {
    const r = await newRequest(client, { address: "Av. Irarrázaval 1234, depto 56" });
    const inbox = await listRequests(near);
    const item = inbox.find((x) => x.id === r.id);
    expect(item?.commune).toBe("Ñuñoa");
    expect(item?.distanceKm).toBeGreaterThan(0);
    expect(item?.address).toBeNull();
    expect(item?.clientId).toBe("");
    expect((await listRequests(far)).some((x) => x.id === r.id)).toBe(false);
    const detail = await getRequestDetail(r.id, near);
    expect(detail.address).toBeNull();
    await expect(getRequestDetail(r.id, far)).rejects.toMatchObject({ status: 403 });
  });
});

describe("PR-025 cotización (COT-01, RN-04)", () => {
  it("solo un proveedor elegible cotiza, una vez, y la solicitud pasa a con_cotizaciones", async () => {
    const r = await newRequest();
    await expect(createQuote(quoteInput(r.id), far)).rejects.toMatchObject({ status: 403 });
    await expect(createQuote(quoteInput(r.id), unverified)).rejects.toMatchObject({ status: 403 });
    const q = await createQuote(quoteInput(r.id), near);
    expect(q.status).toBe("enviada");
    await expect(createQuote(quoteInput(r.id), near)).rejects.toMatchObject({ status: 409 });
    expect((await getRequestDetail(r.id, client)).status).toBe("con_cotizaciones");
  });

  it("un proveedor sin perfil no puede cotizar", async () => {
    const r = await newRequest();
    const ghost = { id: "flow-sin-perfil", email: "g@test.cl", role: "proveedor" as const };
    await expect(createQuote(quoteInput(r.id), ghost)).rejects.toMatchObject({ status: 409 });
  });

  it("el proveedor solo ve su propia cotización, no la de la competencia", async () => {
    const r = await newRequest();
    await createQuote(quoteInput(r.id, 80000), near);
    await createQuote(quoteInput(r.id, 70000), near2);
    const seen = await getRequestDetail(r.id, near);
    expect(seen.quotes).toHaveLength(1);
    expect(seen.quotes[0].amount).toBe(80000);
  });
});

describe("PR-026 comparar y aceptar (COT-02, RN-05)", () => {
  it("el cliente ve todas con distancia; aceptar rechaza el resto y avisa a ambos", async () => {
    const r = await newRequest();
    const a = await createQuote(quoteInput(r.id, 80000), near);
    const b = await createQuote(quoteInput(r.id, 70000), near2);
    const detail = await getRequestDetail(r.id, client);
    expect(detail.quotes.map((q) => q.amount).sort()).toEqual([70000, 80000]);
    expect(detail.quotes.every((q) => typeof q.distanceKm === "number")).toBe(true);

    await expect(decideQuote(a.id, "aceptar", otherClient)).rejects.toMatchObject({ status: 403 });
    await decideQuote(a.id, "aceptar", client);
    const after = await getRequestDetail(r.id, client);
    expect(after.status).toBe("aceptada");
    expect(after.quotes.find((q) => q.id === a.id)?.status).toBe("aceptada");
    expect(after.quotes.find((q) => q.id === b.id)?.status).toBe("rechazada");
    expect(
      (await listNotifications(near.id)).some(
        (n) => n.type === "cotizacion_aceptada" && n.refId === r.id,
      ),
    ).toBe(true);
    expect(
      (await listNotifications(near2.id)).some(
        (n) => n.type === "cotizacion_rechazada" && n.refId === r.id,
      ),
    ).toBe(true);

    // SOL-03: la aceptada desaparece de la bandeja del otro proveedor.
    expect((await listRequests(near2)).some((x) => x.id === r.id)).toBe(false);
    // El adjudicado ya ve la dirección.
    expect((await getRequestDetail(r.id, near)).clientId).toBe(client.id);
  });

  it("el cliente puede rechazar una cotización y la solicitud sigue abierta a otras", async () => {
    const r = await newRequest();
    const a = await createQuote(quoteInput(r.id), near);
    await decideQuote(a.id, "rechazar", client);
    const after = await getRequestDetail(r.id, client);
    expect(after.quotes[0].status).toBe("rechazada");
    expect(after.status).toBe("con_cotizaciones");
    // RN-04 aplica a cotizaciones activas: puede volver a cotizar.
    await expect(createQuote(quoteInput(r.id, 75000), near)).resolves.toMatchObject({
      status: "enviada",
    });
  });
});

describe("PR-023/024/027 estados (SOL-04, SOL-05, COT-03, D-11)", () => {
  it("solo el adjudicado inicia y completa; el cliente confirma", async () => {
    const r = await newRequest();
    const a = await createQuote(quoteInput(r.id), near);
    await decideQuote(a.id, "aceptar", client);

    await expect(transitionRequest(r.id, "en_ejecucion", near2)).rejects.toMatchObject({
      status: 403,
    });
    await expect(transitionRequest(r.id, "en_ejecucion", client)).rejects.toMatchObject({
      status: 403,
    });
    await expect(transitionRequest(r.id, "completada", near)).rejects.toMatchObject({
      status: 400,
    });
    await transitionRequest(r.id, "en_ejecucion", near);
    await expect(
      transitionRequest(r.id, "cancelada", client, { reason: "presupuesto_alto" }),
    ).rejects.toMatchObject({
      status: 400,
    });
    const done = await transitionRequest(r.id, "completada", near);
    expect(done.completedAt).toBeTruthy();
    expect(done.clientConfirmedAt).toBeNull();

    await expect(confirmCompletion(r.id, otherClient)).rejects.toMatchObject({ status: 403 });
    const confirmed = await confirmCompletion(r.id, client);
    expect(confirmed.clientConfirmedAt).toBeTruthy();
    await expect(confirmCompletion(r.id, client)).rejects.toMatchObject({ status: 400 });

    const events = (await getRequestDetail(r.id, client)).events.map((e) => e.toStatus);
    expect(events).toEqual([
      "abierta",
      "con_cotizaciones",
      "aceptada",
      "en_ejecucion",
      "completada",
      "completada",
    ]);
  });

  it("PR-024: solo el cliente cancela, con motivo obligatorio, y se avisa a quienes cotizaron", async () => {
    const r = await newRequest();
    await createQuote(quoteInput(r.id), near);
    const reason = { reason: "otro" as const, reasonDetail: "Ya lo resolví" };
    await expect(transitionRequest(r.id, "cancelada", otherClient, reason)).rejects.toMatchObject({
      status: 403,
    });
    await expect(transitionRequest(r.id, "cancelada", near, reason)).rejects.toMatchObject({
      status: 403,
    });
    // SOL-05: sin motivo, o "otro" sin detalle, no se cancela.
    await expect(transitionRequest(r.id, "cancelada", client)).rejects.toMatchObject({
      status: 400,
    });
    await expect(
      transitionRequest(r.id, "cancelada", client, { reason: "otro", reasonDetail: " " }),
    ).rejects.toMatchObject({ status: 400 });
    expect((await getRequestDetail(r.id, client)).status).toBe("con_cotizaciones");

    const cancelled = await transitionRequest(r.id, "cancelada", client, reason);
    expect(cancelled.status).toBe("cancelada");
    expect(cancelled.cancelReason).toBe("otro");
    expect(cancelled.cancelReasonDetail).toBe("Ya lo resolví");
    expect(cancelled.cancelledAt).toBeTruthy();
    const detail = await getRequestDetail(r.id, client);
    expect(detail.quotes[0].status).toBe("rechazada");
    expect(detail.events.at(-1)?.note).toBe("Otro: Ya lo resolví");
    expect(
      (await listNotifications(near.id)).some(
        (n) => n.refId === r.id && n.body === "Motivo: Otro: Ya lo resolví",
      ),
    ).toBe(true);
    await expect(createQuote(quoteInput(r.id), near2)).rejects.toMatchObject({ status: 400 });
  });

  it("PR-024: un motivo de la lista no exige detalle", async () => {
    const r = await newRequest();
    const cancelled = await transitionRequest(r.id, "cancelada", client, {
      reason: "presupuesto_alto",
    });
    expect(cancelled.cancelReason).toBe("presupuesto_alto");
    expect(cancelled.cancelReasonDetail).toBeNull();
    expect((await getRequestDetail(r.id, client)).events.at(-1)?.note).toBe("Presupuesto alto");
  });

  it(`la confirmación es automática a los ${AUTO_CONFIRM_DAYS} días`, async () => {
    const r = await newRequest();
    const a = await createQuote(quoteInput(r.id), near);
    await decideQuote(a.id, "aceptar", client);
    await transitionRequest(r.id, "en_ejecucion", near);
    await transitionRequest(r.id, "completada", near);
    const realNow = Date.now;
    Date.now = () => realNow() + (AUTO_CONFIRM_DAYS + 1) * 24 * 60 * 60 * 1000;
    try {
      expect((await getRequestDetail(r.id, client)).clientConfirmedAt).toBeTruthy();
    } finally {
      Date.now = realNow;
    }
  });
});

describe("COT-01 vencimiento", () => {
  it("una cotización vencida no se puede aceptar", async () => {
    const r = await newRequest();
    const a = await createQuote({ ...quoteInput(r.id), validDays: 1 }, near);
    const realNow = Date.now;
    Date.now = () => realNow() + 2 * 24 * 60 * 60 * 1000;
    try {
      const detail = await getRequestDetail(r.id, client);
      expect(detail.quotes[0].status).toBe("vencida");
      await expect(decideQuote(a.id, "aceptar", client)).rejects.toMatchObject({ status: 400 });
    } finally {
      Date.now = realNow;
    }
  });
});

describe("Solicitud directa a una empresa (desde su perfil)", () => {
  it("solo la empresa elegida la ve, marcada como directa, y puede cotizarla", async () => {
    const target = (await verifiedDemoProvider("directa-destino", { commune: "Arica" })).id;
    // Pedida desde Ñuñoa: fuera de la cobertura de Arica, pero el cliente la eligió.
    const r = await newRequest(client, { targetProviderId: target });
    expect(r.targetProviderName).toBe("Proveedor directa-destino");

    const destino = { id: "directa-destino", email: "d@test.cl", role: "proveedor" as const };
    const inbox = await listRequests(destino);
    expect(inbox.find((x) => x.id === r.id)?.isDirect).toBe(true);
    expect((await listRequests(near)).some((x) => x.id === r.id)).toBe(false);
    expect((await listNotifications(near.id)).some((n) => n.refId === r.id)).toBe(false);
    expect((await listNotifications(destino.id)).find((n) => n.refId === r.id)?.title).toBe(
      "Nueva solicitud directa para tu empresa",
    );

    await expect(createQuote(quoteInput(r.id), near)).rejects.toMatchObject({ status: 403 });
    await expect(createQuote(quoteInput(r.id), destino)).resolves.toMatchObject({
      status: "enviada",
    });
  });

  it("rechaza empresas sin cuenta o no verificadas", async () => {
    await expect(newRequest(client, { targetProviderId: "p-calor-central" })).rejects.toMatchObject(
      {
        status: 409,
      },
    );
    await expect(newRequest(client, { targetProviderId: "no-existe" })).rejects.toMatchObject({
      status: 404,
    });
  });
});
