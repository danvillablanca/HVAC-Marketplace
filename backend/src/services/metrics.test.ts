import { beforeAll, describe, expect, it } from "vitest";
import { SERVICE_CATALOG, currentMonthRange } from "@hvac/shared";
import type { AuthenticatedUser } from "@/lib/auth";
import { verifiedDemoProvider } from "@/test/providers";
import { createQuote, createRequest, decideQuote, transitionRequest } from "./requests";
import { getCancellationMetrics, getProviderMetrics } from "./metrics";

const client: AuthenticatedUser = { id: "met-cliente", email: "mc@test.cl", role: "cliente" };
const prov: AuthenticatedUser = { id: "met-prov", email: "mp@test.cl", role: "proveedor" };
const rival: AuthenticatedUser = { id: "met-prov-2", email: "mp2@test.cl", role: "proveedor" };
const noProfile: AuthenticatedUser = {
  id: "met-sin-perfil",
  email: "x@test.cl",
  role: "proveedor",
};

const quote = (requestId: string, amount: number) => ({
  requestId,
  amount,
  includesIva: true,
  scope: "Mantención completa del equipo con informe técnico",
  deadlineDays: 2,
  validDays: 10,
});

async function newRequest() {
  return createRequest(
    {
      serviceId: SERVICE_CATALOG[1].id,
      equipment: "split",
      description: "Mantención de un split que gotea agua en el dormitorio",
      urgency: "media",
      commune: "Ñuñoa",
      photos: [],
    },
    client.id,
  );
}

beforeAll(async () => {
  await verifiedDemoProvider(prov.id, { commune: "Ñuñoa", coverageRadiusKm: 15 });
  await verifiedDemoProvider(rival.id, { commune: "Providencia", coverageRadiusKm: 15 });
});

describe("métricas comerciales del proveedor (modo demo)", () => {
  it("cuenta recibidas, cotizadas, aceptadas, tasas, tiempo, monto y motivos", async () => {
    const range = currentMonthRange();
    const before = await getProviderMetrics(prov, range);

    const won = await newRequest();
    const lost = await newRequest();
    const cancelled = await newRequest();
    await newRequest(); // recibida, sin cotizar

    const q1 = await createQuote(quote(won.id, 120000), prov);
    await createQuote(quote(lost.id, 90000), prov);
    const rivalQuote = await createQuote(quote(lost.id, 80000), rival);
    await decideQuote(q1.id, "aceptar", client);
    await decideQuote(rivalQuote.id, "aceptar", client);
    await transitionRequest(cancelled.id, "cancelada", client, { reason: "presupuesto_alto" });

    const after = await getProviderMetrics(prov, range);
    const c = after.current;
    expect(c.received - before.current.received).toBe(4);
    expect(c.quoted - before.current.quoted).toBe(2);
    expect(c.accepted - before.current.accepted).toBe(1);
    expect(c.acceptedAmount - before.current.acceptedAmount).toBe(120000);
    expect(c.cancelReasons.presupuesto_alto - before.current.cancelReasons.presupuesto_alto).toBe(
      1,
    );
    expect(c.quoteRate).not.toBeNull();
    expect(c.quoteRate!).toBeLessThanOrEqual(1);
    expect(c.acceptanceRate!).toBeLessThanOrEqual(1);
    expect(c.avgFirstResponseSeconds).not.toBeNull();
    expect(after.range).toEqual(range);
    expect(after.previousRange.to < range.from).toBe(true);
    // El período anterior no tiene actividad: sin base de comparación.
    expect(after.deltas.received).toBeNull();
  });

  it("un rango sin actividad devuelve ceros", async () => {
    const m = await getProviderMetrics(prov, { from: "2020-01-01", to: "2020-01-31" });
    expect(m.current.received).toBe(0);
    expect(m.current.quoteRate).toBeNull();
    expect(m.previousRange).toEqual({ from: "2019-12-01", to: "2019-12-31" });
  });

  it("un proveedor sin perfil ve métricas vacías", async () => {
    const m = await getProviderMetrics(noProfile, currentMonthRange());
    expect(m.current.received).toBe(0);
  });

  it("el admin ve los motivos de cancelación de la plataforma", async () => {
    const m = await getCancellationMetrics(currentMonthRange());
    expect(m.reasons.presupuesto_alto).toBeGreaterThanOrEqual(1);
    expect(m.total).toBe(Object.values(m.reasons).reduce((a, b) => a + b, 0));
  });
});
