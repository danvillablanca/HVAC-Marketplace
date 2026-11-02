import { corsPreflight, handleErrors, jsonOk } from "@/lib/http";
import { requireRole } from "@/lib/auth";
import { acceptQuote } from "@/services/requests";

export function OPTIONS() {
  return corsPreflight();
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErrors(async () => {
    const user = await requireRole(req, ["cliente"]);
    const { id } = await params;
    await acceptQuote(id, user.id);
    return jsonOk({ accepted: true });
  });
}
