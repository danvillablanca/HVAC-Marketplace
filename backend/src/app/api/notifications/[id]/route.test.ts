import { describe, expect, it } from "vitest";
import { jsonRequest, withId } from "@/test/http";
import { createNotification } from "@/services/notifications";
import { PATCH, OPTIONS } from "./route";

describe("PATCH /api/notifications/:id", () => {
  it("marca una notificación como leída", async () => {
    const notif = await createNotification({
      userId: "test-cliente",
      type: "nueva_cotizacion",
      title: "Nueva cotización recibida",
      body: "Proveedor Demo te envió una cotización.",
      refType: "quote",
      refId: "quote-123",
    });

    const res = await PATCH(
      jsonRequest("PATCH", `/api/notifications/${notif.id}`, { read: true }),
      withId(notif.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.read).toBe(true);
  });

  it("404 si la notificación no existe", async () => {
    const res = await PATCH(
      jsonRequest("PATCH", "/api/notifications/fake-id", { read: true }),
      withId("fake-id"),
    );
    expect(res.status).toBe(404);
  });

  it("rechaza sin autenticación", async () => {
    const res = await PATCH(
      jsonRequest("PATCH", "/api/notifications/any-id", { read: true }, { noAuth: true }),
      withId("any-id"),
    );
    expect(res.status).toBe(401);
  });
});

describe("OPTIONS /api/notifications/:id", () => {
  it("responde 204 con CORS", () => {
    const res = OPTIONS();
    expect(res.status).toBe(204);
  });
});
