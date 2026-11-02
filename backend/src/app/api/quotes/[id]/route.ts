import { corsPreflight, handleErrors, jsonOk } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { acceptQuote } from "@/services/requests";

export function OPTIONS() {
  return corsPreflight();
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErrors(async () => {
    const user = await requireUser(req);
    const { id } = await params;
    await acceptQuote(id, user.id);
    return jsonOk({ accepted: true });
  });
}
