import { metricsQuerySchema } from "@hvac/shared";
import { corsPreflight, handleErrors, jsonOk, parseQuery } from "@/lib/http";
import { requireRole } from "@/lib/auth";
import { getCancellationMetrics } from "@/services/metrics";

export function OPTIONS() {
  return corsPreflight();
}

/** Motivos de cancelación de la plataforma en el rango (solo admin). */
export async function GET(req: Request) {
  return handleErrors(async () => {
    await requireRole(req, ["admin"]);
    const range = parseQuery(metricsQuerySchema, req);
    return jsonOk(await getCancellationMetrics(range));
  });
}
