import { corsPreflight, handleErrors, jsonOk } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { listNotifications, markAllRead, getUnreadCount } from "@/services/notifications";

export function OPTIONS() {
  return corsPreflight();
}

export async function GET(req: Request) {
  return handleErrors(async () => {
    const user = await requireUser(req);
    const url = new URL(req.url);
    if (url.searchParams.get("count") === "unread") {
      const count = await getUnreadCount(user.id);
      return jsonOk({ unread: count });
    }
    const notifications = await listNotifications(user.id);
    return jsonOk(notifications);
  });
}

export async function PATCH(req: Request) {
  return handleErrors(async () => {
    const user = await requireUser(req);
    const count = await markAllRead(user.id);
    return jsonOk({ markedRead: count });
  });
}
