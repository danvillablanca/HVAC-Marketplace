import { quoteDecisionSchema } from "@hvac/shared";
import { corsPreflight, handleErrors, jsonOk } from "@/lib/http";
import { requireRole } from "@/lib/auth";
import { decideQuote } from "@/services/requests";

export function OPTIONS() {
  return corsPreflight();
}

/** COT-02: el cliente acepta (por defecto) o rechaza una cotizacion. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErrors(async () => {
    const user = await requireRole(req, ["cliente"]);
    const { id } = await params;
    const raw = await req.json().catch(() => ({}));
    const { action } = quoteDecisionSchema.parse(raw ?? {});
    return jsonOk(await decideQuote(id, action, user));
  });
}
