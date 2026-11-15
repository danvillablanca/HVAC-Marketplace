import { describe, expect, it } from "vitest";
import {
  buildSnapshot,
  computeDeltas,
  formatDuration,
  metricsQuerySchema,
  previousPeriod,
  rangeBounds,
} from "./metrics";

const raw = {
  received: 10,
  quoted: 5,
  accepted: 2,
  receivedQuoted: 4,
  quotedAccepted: 2,
  avgFirstResponseSeconds: 3600,
  acceptedAmount: 200000,
};

describe("métricas del proveedor: rango y período anterior", () => {
  it("mes en curso se compara con los mismos días del mes anterior", () => {
    expect(previousPeriod({ from: "2026-11-01", to: "2026-11-13" })).toEqual({
      from: "2026-10-01",
      to: "2026-10-13",
    });
  });

  it("mes completo se compara con el mes anterior completo", () => {
    expect(previousPeriod({ from: "2026-03-01", to: "2026-03-31" })).toEqual({
      from: "2026-02-01",
      to: "2026-02-28",
    });
    expect(previousPeriod({ from: "2026-01-01", to: "2026-01-31" })).toEqual({
      from: "2025-12-01",
      to: "2025-12-31",
    });
  });

  it("rango arbitrario se compara con el período anterior de igual duración", () => {
    expect(previousPeriod({ from: "2026-10-15", to: "2026-11-13" })).toEqual({
      from: "2026-09-15",
      to: "2026-10-14",
    });
  });

  it("los límites son semiabiertos e incluyen el último día", () => {
    expect(rangeBounds({ from: "2026-11-01", to: "2026-11-13" })).toEqual({
      start: "2026-11-01T00:00:00.000Z",
      end: "2026-11-14T00:00:00.000Z",
    });
  });

  it("valida el rango", () => {
    expect(metricsQuerySchema.safeParse({ from: "2026-11-10", to: "2026-11-01" }).success).toBe(
      false,
    );
    expect(metricsQuerySchema.safeParse({ from: "2024-01-01", to: "2026-01-01" }).success).toBe(
      false,
    );
    expect(metricsQuerySchema.safeParse({ from: "13-11-2026" }).success).toBe(false);
    const def = metricsQuerySchema.parse({});
    expect(def.from.endsWith("-01")).toBe(true);
  });
});

describe("métricas del proveedor: cálculos", () => {
  it("tasas acotadas a las recibidas y cotizadas del período", () => {
    const s = buildSnapshot(raw);
    expect(s.quoteRate).toBe(0.4);
    expect(s.acceptanceRate).toBe(0.4);
    expect(s.cancelReasons.otro).toBe(0);
  });

  it("sin datos las tasas y el tiempo quedan en null", () => {
    const s = buildSnapshot({ ...raw, received: 0, quoted: 0, avgFirstResponseSeconds: null });
    expect(s.quoteRate).toBeNull();
    expect(s.acceptanceRate).toBeNull();
    expect(s.avgFirstResponseSeconds).toBeNull();
  });

  it("variaciones: % para conteos, puntos para tasas, null sin base", () => {
    const current = buildSnapshot(raw);
    const previous = buildSnapshot({ ...raw, received: 8, accepted: 0, receivedQuoted: 2 });
    const d = computeDeltas(current, previous);
    expect(d.received).toBe(25);
    expect(d.accepted).toBeNull();
    expect(d.quoteRate).toBe(15);
    expect(d.acceptedAmount).toBe(0);
  });

  it("formatea duraciones", () => {
    expect(formatDuration(null)).toBe("—");
    expect(formatDuration(600)).toBe("10 min");
    expect(formatDuration(5400)).toBe("1,5 h");
    expect(formatDuration(2 * 86400)).toBe("2 días");
  });
});
