import {
  CANCEL_REASONS,
  buildSnapshot,
  computeDeltas,
  emptyCancelReasons,
  previousPeriod,
  rangeBounds,
  type CancelReason,
  type CancellationMetricsResponse,
  type DateRange,
  type ProviderMetricsResponse,
  type ProviderMetricsSnapshot,
} from "@hvac/shared";
import type { AuthenticatedUser } from "../lib/auth";
import { getServiceClient } from "../lib/supabase";
import { HttpError } from "../lib/http";
import { demoMetricsSource, findProviderId } from "./requests";

/** Mismo cálculo que la RPC provider_metrics (migración 0014), en memoria. */
function demoProviderSnapshot(providerId: string, range: DateRange): ProviderMetricsSnapshot {
  const { start, end } = rangeBounds(range);
  const inRange = (at: string | null | undefined) => Boolean(at && at >= start && at < end);
  const { requests, deliveries } = demoMetricsSource();

  let received = 0;
  let quoted = 0;
  let accepted = 0;
  let receivedQuoted = 0;
  let quotedAccepted = 0;
  let acceptedAmount = 0;
  const responses: number[] = [];
  const cancelReasons: Partial<Record<CancelReason, number>> = {};

  for (const r of requests) {
    const deliveredAt = deliveries.get(r.id)?.get(providerId);
    const mine = r.quotes.filter((q) => q.providerId === providerId);
    const firstAt = mine.map((q) => q.createdAt).sort()[0];

    if (deliveredAt && inRange(deliveredAt)) {
      received += 1;
      if (firstAt) receivedQuoted += 1;
    }
    if (firstAt && inRange(firstAt)) {
      quoted += 1;
      if (mine.some((q) => q.status === "aceptada")) quotedAccepted += 1;
      if (deliveredAt && firstAt >= deliveredAt) {
        responses.push((Date.parse(firstAt) - Date.parse(deliveredAt)) / 1000);
      }
    }
    for (const q of mine) {
      if (inRange(q.acceptedAt)) {
        accepted += 1;
        acceptedAmount += q.amount;
      }
    }
    if (deliveredAt && r.status === "cancelada" && r.cancelReason && inRange(r.cancelledAt)) {
      cancelReasons[r.cancelReason] = (cancelReasons[r.cancelReason] ?? 0) + 1;
    }
  }

  return buildSnapshot({
    received,
    quoted,
    accepted,
    receivedQuoted,
    quotedAccepted,
    avgFirstResponseSeconds: responses.length
      ? responses.reduce((a, b) => a + b, 0) / responses.length
      : null,
    acceptedAmount,
    cancelReasons,
  });
}

async function providerSnapshot(
  db: any,
  providerId: string | null,
  range: DateRange,
): Promise<ProviderMetricsSnapshot> {
  if (!providerId) return buildSnapshot({ ...EMPTY_RAW });
  if (!db) return demoProviderSnapshot(providerId, range);
  const { start, end } = rangeBounds(range);
  const { data, error } = await db.rpc("provider_metrics", {
    p_provider_id: providerId,
    p_from: start,
    p_to: end,
  });
  if (error) throw new HttpError("metrics_error", error.message, 500);
  return buildSnapshot({
    received: Number(data.received ?? 0),
    quoted: Number(data.quoted ?? 0),
    accepted: Number(data.accepted ?? 0),
    receivedQuoted: Number(data.receivedQuoted ?? 0),
    quotedAccepted: Number(data.quotedAccepted ?? 0),
    avgFirstResponseSeconds:
      data.avgFirstResponseSeconds === null || data.avgFirstResponseSeconds === undefined
        ? null
        : Number(data.avgFirstResponseSeconds),
    acceptedAmount: Number(data.acceptedAmount ?? 0),
    cancelReasons: data.cancelReasons ?? {},
  });
}

const EMPTY_RAW = {
  received: 0,
  quoted: 0,
  accepted: 0,
  receivedQuoted: 0,
  quotedAccepted: 0,
  avgFirstResponseSeconds: null,
  acceptedAmount: 0,
};

/** Métricas comerciales del proveedor en el rango y en el período anterior. */
export async function getProviderMetrics(
  user: AuthenticatedUser,
  range: DateRange,
): Promise<ProviderMetricsResponse> {
  const db = getServiceClient();
  const providerId = await findProviderId(user);
  const previousRange = previousPeriod(range);
  const [current, previous] = await Promise.all([
    providerSnapshot(db, providerId, range),
    providerSnapshot(db, providerId, previousRange),
  ]);
  return { range, previousRange, current, previous, deltas: computeDeltas(current, previous) };
}

/** Motivos de cancelación de toda la plataforma (panel del administrador). */
export async function getCancellationMetrics(
  range: DateRange,
): Promise<CancellationMetricsResponse> {
  const db = getServiceClient();
  const reasons = emptyCancelReasons();
  if (!db) {
    const { start, end } = rangeBounds(range);
    for (const r of demoMetricsSource().requests) {
      if (
        r.status === "cancelada" &&
        r.cancelReason &&
        r.cancelledAt &&
        r.cancelledAt >= start &&
        r.cancelledAt < end
      ) {
        reasons[r.cancelReason] += 1;
      }
    }
  } else {
    const { start, end } = rangeBounds(range);
    const { data, error } = await db.rpc("admin_cancellation_metrics", {
      p_from: start,
      p_to: end,
    });
    if (error) throw new HttpError("metrics_error", error.message, 500);
    for (const r of CANCEL_REASONS) reasons[r] = Number(data?.[r] ?? 0);
  }
  const total = CANCEL_REASONS.reduce((sum, r) => sum + reasons[r], 0);
  return { range, total, reasons };
}
