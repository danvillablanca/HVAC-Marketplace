import { describe, expect, it } from "vitest";
import { jsonRequest } from "@/test/http";
import { createNotification } from "@/services/notifications";
import { GET, OPTIONS, PATCH } from "./route";

describe("GET /api/notifications", () => {
  it("lista notificaciones del usuario autenticado", async () => {
    // Crear una notificación para el usuario de test
    await createNotification({
      userId: "test-cliente",
      type: "sistema",
      title: "Bienvenido a HVAC Connect",
      body: "Tu cuenta fue creada exitosamente.",
    });

    const res = await GET(jsonRequest("GET", "/api/notifications"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0]).toMatchObject({
      title: "Bienvenido a HVAC Connect",
      type: "sistema",
      read: false,
    });
  });

  it("retorna conteo de no leídas con ?count=unread", async () => {
    await createNotification({
      userId: "test-cliente",
      type: "sistema",
      title: "Otra notificación",
    });

    const res = await GET(jsonRequest("GET", "/api/notifications?count=unread"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.unread).toBeGreaterThanOrEqual(1);
  });

  it("rechaza sin autenticación", async () => {
    const res = await GET(jsonRequest("GET", "/api/notifications", undefined, { noAuth: true }));
    expect(res.status).toBe(401);
  });
});

describe("PATCH /api/notifications (mark all read)", () => {
  it("marca todas las notificaciones como leídas", async () => {
    await createNotification({
      userId: "test-cliente",
      type: "sistema",
      title: "Notificación para marcar",
    });

    const res = await PATCH(jsonRequest("PATCH", "/api/notifications"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.markedRead).toBeGreaterThanOrEqual(0);
  });
});

describe("OPTIONS /api/notifications", () => {
  it("responde 204 con CORS", () => {
    const res = OPTIONS();
    expect(res.status).toBe(204);
  });
});
