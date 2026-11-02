import { describe, expect, it } from "vitest";
import {
  createNotification,
  getUnreadCount,
  listNotifications,
  markAllRead,
  markRead,
} from "./notifications";

describe("notifications service (demo)", () => {
  it("crea y lista notificaciones", async () => {
    const n = await createNotification({
      userId: "svc-user-1",
      type: "sistema",
      title: "Test",
      body: "Cuerpo de prueba",
    });
    expect(n.id).toBeTruthy();
    expect(n.read).toBe(false);

    const list = await listNotifications("svc-user-1");
    expect(list.some((x) => x.id === n.id)).toBe(true);
  });

  it("marca una notificación como leída", async () => {
    const n = await createNotification({
      userId: "svc-user-2",
      type: "nueva_cotizacion",
      title: "Cotización nueva",
    });

    const updated = await markRead(n.id, "svc-user-2");
    expect(updated.read).toBe(true);
  });

  it("markRead lanza 404 si no es del usuario", async () => {
    const n = await createNotification({
      userId: "svc-user-3",
      type: "sistema",
      title: "Ajena",
    });

    await expect(markRead(n.id, "otro-usuario")).rejects.toThrow("no encontrada");
  });

  it("cuenta no leídas y marca todas como leídas", async () => {
    await createNotification({ userId: "svc-user-4", type: "sistema", title: "A" });
    await createNotification({ userId: "svc-user-4", type: "sistema", title: "B" });

    const count = await getUnreadCount("svc-user-4");
    expect(count).toBeGreaterThanOrEqual(2);

    const marked = await markAllRead("svc-user-4");
    expect(marked).toBeGreaterThanOrEqual(2);

    const after = await getUnreadCount("svc-user-4");
    expect(after).toBe(0);
  });
});
