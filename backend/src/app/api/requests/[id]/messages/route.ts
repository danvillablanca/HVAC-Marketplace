import { messageCreateSchema } from "@hvac/shared";
import { corsPreflight, handleErrors, jsonOk, parseBody } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { listMessages, sendMessage } from "@/services/messages";

export function OPTIONS() {
  return corsPreflight();
}

/** MSG-01: historial del hilo (?providerId= para el cliente). */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErrors(async () => {
    const user = await requireUser(req);
    const { id } = await params;
    const providerId = new URL(req.url).searchParams.get("providerId") ?? undefined;
    return jsonOk(await listMessages(id, user, providerId));
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErrors(async () => {
    const user = await requireUser(req);
    const { id } = await params;
    const input = await parseBody(messageCreateSchema, req);
    return jsonOk(await sendMessage(id, user, input.body, input.providerId), { status: 201 });
  });
}
