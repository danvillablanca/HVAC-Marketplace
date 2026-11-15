import { notificationMarkReadSchema } from "@hvac/shared";
import { corsPreflight, handleErrors, jsonOk, parseBody } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { markRead } from "@/services/notifications";

export function OPTIONS() {
  return corsPreflight();
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErrors(async () => {
    const user = await requireUser(req);
    const { id } = await params;
    await parseBody(notificationMarkReadSchema, req);
    const notification = await markRead(id, user.id);
    return jsonOk(notification);
  });
}
