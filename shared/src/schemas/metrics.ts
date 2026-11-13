import { z } from "zod";
import { CANCEL_REASONS, type CancelReason } from "../types/index";

/**
 * Métricas comerciales del proveedor (solicitud de cambio, 13/11/2026).
 * El rango se expresa en fechas `aaaa-mm-dd`, ambas inclusive; el servidor
 * consulta el intervalo semiabierto [from 00:00, to + 1 día 00:00) en UTC.
 */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;
export const METRICS_MAX_DAYS = 366;

const isoDate = z
  .string()
  .regex(ISO_DATE, "Usa el formato aaaa-mm-dd")
  .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), "Fecha inválida");

export interface DateRange {
  from: string;
  to: string;
}

function toDate(v: string): Date {
  return new Date(`${v}T00:00:00Z`);
}
function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function daysBetween(from: string, to: string): number {
  return Math.round((toDate(to).getTime() - toDate(from).getTime()) / DAY_MS) + 1;
}
function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/** Mes en curso hasta hoy (rango por defecto). */
export function currentMonthRange(today: Date = new Date()): DateRange {
  const from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  return { from: toIso(from), to: toIso(today) };
}

export const metricsQuerySchema = z
  .object({ from: isoDate.optional(), to: isoDate.optional() })
  .transform((v) => {
    const def = currentMonthRange();
    return { from: v.from ?? def.from, to: v.to ?? def.to };
  })
  .refine((v) => v.from <= v.to, { message: "La fecha inicial debe ser anterior a la final" })
  .refine((v) => daysBetween(v.from, v.to) <= METRICS_MAX_DAYS, {
    message: `El rango no puede superar ${METRICS_MAX_DAYS} días`,
  });
export type MetricsQueryInput = z.infer<typeof metricsQuerySchema>;

/**
 * Período de comparación. Si el rango empieza el día 1 y cae dentro de un mes
 * (mes completo o mes en curso), se compara con los mismos días del mes anterior;
 * si no, con el período inmediatamente anterior de igual duración.
 */
export function previousPeriod(range: DateRange): DateRange {
  const from = toDate(range.from);
  const to = toDate(range.to);
  const sameMonth =
    from.getUTCFullYear() === to.getUTCFullYear() && from.getUTCMonth() === to.getUTCMonth();
  if (from.getUTCDate() === 1 && sameMonth) {
    const y = from.getUTCFullYear();
    const m = from.getUTCMonth();
    const prevLast = lastDayOfMonth(y, m - 1);
    const isFullMonth = to.getUTCDate() === lastDayOfMonth(y, m);
    const endDay = isFullMonth ? prevLast : Math.min(to.getUTCDate(), prevLast);
    return {
      from: toIso(new Date(Date.UTC(y, m - 1, 1))),
      to: toIso(new Date(Date.UTC(y, m - 1, endDay))),
    };
  }
  const days = daysBetween(range.from, range.to);
  return {
    from: toIso(new Date(from.getTime() - days * DAY_MS)),
    to: toIso(new Date(from.getTime() - DAY_MS)),
  };
}

/** Límites del rango como instantes [start, end) para las consultas. */
export function rangeBounds(range: DateRange): { start: string; end: string } {
  return {
    start: toDate(range.from).toISOString(),
    end: new Date(toDate(range.to).getTime() + DAY_MS).toISOString(),
  };
}

export interface ProviderMetricsSnapshot {
  /** Solicitudes que llegaron al proveedor en el rango. */
  received: number;
  /** Solicitudes distintas cotizadas (primera cotización en el rango). */
  quoted: number;
  /** Cotizaciones aceptadas en el rango. */
  accepted: number;
  /** De las recibidas en el rango, fracción cotizada (0-1); null sin recibidas. */
  quoteRate: number | null;
  /** De las cotizadas en el rango, fracción aceptada (0-1); null sin cotizadas. */
  acceptanceRate: number | null;
  /** Promedio entre la llegada y la primera cotización; null sin datos. */
  avgFirstResponseSeconds: number | null;
  /** Suma en CLP de las cotizaciones aceptadas en el rango. */
  acceptedAmount: number;
  /** Solicitudes recibidas por el proveedor y canceladas en el rango, por motivo. */
  cancelReasons: Record<CancelReason, number>;
}

export type MetricKey = Exclude<keyof ProviderMetricsSnapshot, "cancelReasons">;
export const METRIC_KEYS: MetricKey[] = [
  "received",
  "quoted",
  "accepted",
  "quoteRate",
  "acceptanceRate",
  "avgFirstResponseSeconds",
  "acceptedAmount",
];
/** Las tasas se comparan en puntos porcentuales; el resto, en % de variación. */
export const RATE_KEYS: MetricKey[] = ["quoteRate", "acceptanceRate"];

export interface ProviderMetricsResponse {
  range: DateRange;
  previousRange: DateRange;
  current: ProviderMetricsSnapshot;
  previous: ProviderMetricsSnapshot;
  /** % de variación (o puntos porcentuales en tasas); null si no hay base de comparación. */
  deltas: Record<MetricKey, number | null>;
}

export interface CancellationMetricsResponse {
  range: DateRange;
  total: number;
  reasons: Record<CancelReason, number>;
}

export function emptyCancelReasons(): Record<CancelReason, number> {
  return Object.fromEntries(CANCEL_REASONS.map((r) => [r, 0])) as Record<CancelReason, number>;
}

/** Arma el snapshot a partir de los conteos crudos (comparten demo y RPC). */
export function buildSnapshot(raw: {
  received: number;
  quoted: number;
  accepted: number;
  receivedQuoted: number;
  quotedAccepted: number;
  avgFirstResponseSeconds: number | null;
  acceptedAmount: number;
  cancelReasons?: Partial<Record<string, number>>;
}): ProviderMetricsSnapshot {
  const reasons = emptyCancelReasons();
  for (const r of CANCEL_REASONS) reasons[r] = Number(raw.cancelReasons?.[r] ?? 0);
  return {
    received: raw.received,
    quoted: raw.quoted,
    accepted: raw.accepted,
    quoteRate: raw.received > 0 ? raw.receivedQuoted / raw.received : null,
    acceptanceRate: raw.quoted > 0 ? raw.quotedAccepted / raw.quoted : null,
    avgFirstResponseSeconds:
      raw.avgFirstResponseSeconds === null ? null : Math.round(raw.avgFirstResponseSeconds),
    acceptedAmount: raw.acceptedAmount,
    cancelReasons: reasons,
  };
}

export function computeDeltas(
  current: ProviderMetricsSnapshot,
  previous: ProviderMetricsSnapshot,
): Record<MetricKey, number | null> {
  const out = {} as Record<MetricKey, number | null>;
  for (const key of METRIC_KEYS) {
    const now = current[key];
    const before = previous[key];
    if (now === null || before === null) {
      out[key] = null;
    } else if (RATE_KEYS.includes(key)) {
      out[key] = Math.round((now - before) * 1000) / 10;
    } else if (before === 0) {
      out[key] = null;
    } else {
      out[key] = Math.round(((now - before) / before) * 1000) / 10;
    }
  }
  return out;
}

/** Tiempo legible: "45 min", "3,5 h", "2,1 días". */
export function formatDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  const minutes = seconds / 60;
  if (minutes < 60) return `${Math.max(1, Math.round(minutes))} min`;
  const hours = minutes / 60;
  if (hours < 24) return `${hours.toLocaleString("es-CL", { maximumFractionDigits: 1 })} h`;
  return `${(hours / 24).toLocaleString("es-CL", { maximumFractionDigits: 1 })} días`;
}
