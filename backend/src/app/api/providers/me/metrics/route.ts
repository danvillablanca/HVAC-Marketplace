import { metricsQuerySchema } from "@hvac/shared";
import { corsPreflight, handleErrors, jsonOk, parseQuery } from "@/lib/http";
import { requireRole } from "@/lib/auth";
import { getProviderMetrics } from "@/services/metrics";

export function OPTIONS() {
  return corsPreflight();
}

/** Métricas comerciales del proveedor autenticado (?from=aaaa-mm-dd&to=aaaa-mm-dd). */
export async function GET(req: Request) {
  return handleErrors(async () => {
    const user = await requireRole(req, ["proveedor"]);
    const range = parseQuery(metricsQuerySchema, req);
    return jsonOk(await getProviderMetrics(user, range));
  });
}
