import { corsPreflight, handleErrors, jsonOk } from "@/lib/http";
import { requireRole } from "@/lib/auth";
import { confirmCompletion } from "@/services/requests";

export function OPTIONS() {
  return corsPreflight();
}

/** COT-03: el cliente confirma el trabajo completado. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErrors(async () => {
    const user = await requireRole(req, ["cliente"]);
    const { id } = await params;
    return jsonOk(await confirmCompletion(id, user));
  });
}
