import { corsPreflight, handleErrors, jsonOk } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { listThreads } from "@/services/messages";

export function OPTIONS() {
  return corsPreflight();
}

/** MSG-01: hilos de la solicitud con mensajes no leidos. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErrors(async () => {
    const user = await requireUser(req);
    const { id } = await params;
    return jsonOk(await listThreads(id, user));
  });
}
