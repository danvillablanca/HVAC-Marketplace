import { describe, expect, it } from "vitest";
import { SERVICE_CATALOG, providerProfileSchema, verificationDecisionSchema } from "@hvac/shared";
import { getMyProfile, requestVerification, saveMyProfile } from "./provider-profile";
import { decideVerification, listPendingVerifications } from "./verification";
import { listNotifications } from "./notifications";
import { searchNearby } from "./providers";

const baseInput = providerProfileSchema.parse({
  legalName: "Clima Test SpA",
  rut: "76.123.456-0",
  segment: "residencial",
  description: "Instalacion de split en Ñuñoa.",
  phone: "+56 9 1111 2222",
  email: "contacto@climatest.cl",
  yearsExperience: 5,
  website: "",
  commune: "Ñuñoa",
  coverageRadiusKm: 20,
  isAvailable: true,
  weeklyHours: { lun: { open: "09:00", close: "18:00" } },
  services: [{ serviceId: SERVICE_CATALOG[1].id, priceFrom: 90000 }],
});

describe("perfil del proveedor (modo demo)", () => {
  it("PR-007 un proveedor nuevo no tiene perfil hasta guardarlo", async () => {
    expect(await getMyProfile("prov-nuevo-1")).toBeNull();
  });

  it("PR-007/PR-008 guarda datos y servicios del catalogo", async () => {
    const saved = await saveMyProfile("prov-nuevo-2", baseInput);
    expect(saved.verificationStatus).toBe("pendiente");
    expect(saved.region).toBe("Metropolitana de Santiago");
    expect(saved.services).toEqual([
      { serviceId: SERVICE_CATALOG[1].id, name: SERVICE_CATALOG[1].name, priceFrom: 90000 },
    ]);
    const again = await saveMyProfile("prov-nuevo-2", { ...baseInput, coverageRadiusKm: 40 });
    expect(again.id).toBe(saved.id);
    expect(again.coverageRadiusKm).toBe(40);
  });

  it("PR-009 rechaza comunas fuera del catalogo y radios fuera de 1-100 km", async () => {
    await expect(
      saveMyProfile("prov-nuevo-3", { ...baseInput, commune: "Gotham" }),
    ).rejects.toMatchObject({
      status: 422,
    });
    expect(providerProfileSchema.safeParse({ ...baseInput, coverageRadiusKm: 0 }).success).toBe(
      false,
    );
    expect(providerProfileSchema.safeParse({ ...baseInput, coverageRadiusKm: 101 }).success).toBe(
      false,
    );
    expect(providerProfileSchema.safeParse({ ...baseInput, services: [] }).success).toBe(false);
  });

  it("PR-013 no permite pedir verificacion sin perfil", async () => {
    await expect(
      requestVerification("prov-sin-perfil", { documents: ["RUT"] }),
    ).rejects.toMatchObject({
      status: 409,
    });
  });

  it("PR-013/014/015 verificacion: revision, aprobacion, notificacion y busqueda", async () => {
    const userId = "prov-nuevo-4";
    const saved = await saveMyProfile(userId, { ...baseInput, legalName: "Verificable Ltda." });
    const origin = { lat: -33.456, lng: -70.598, radiusKm: 10, limit: 50, offset: 0 };
    expect((await searchNearby(origin)).some((p) => p.id === saved.id)).toBe(false);

    const sent = await requestVerification(userId, { documents: ["RUT y patente comercial"] });
    expect(sent.verificationStatus).toBe("en_revision");
    expect((await listPendingVerifications()).some((p) => p.id === saved.id)).toBe(true);

    await decideVerification({ providerId: saved.id, decision: "verificado" }, "admin-1");
    expect((await getMyProfile(userId))?.verificationStatus).toBe("verificado");
    expect((await listNotifications(userId)).some((n) => n.type === "verificacion_aprobada")).toBe(
      true,
    );
    expect((await searchNearby(origin)).some((p) => p.id === saved.id)).toBe(true);
  });

  it("PR-014 el rechazo exige motivo y lo informa al proveedor", async () => {
    expect(
      verificationDecisionSchema.safeParse({
        providerId: "00000000-0000-4000-8000-000000000000",
        decision: "rechazado",
      }).success,
    ).toBe(false);

    const userId = "prov-nuevo-5";
    const saved = await saveMyProfile(userId, { ...baseInput, legalName: "Rechazable Ltda." });
    await requestVerification(userId, { documents: ["RUT"] });
    await decideVerification(
      { providerId: saved.id, decision: "rechazado", note: "Patente vencida" },
      "admin-1",
    );
    const profile = await getMyProfile(userId);
    expect(profile?.verificationStatus).toBe("rechazado");
    expect(profile?.verificationNote).toBe("Patente vencida");
    const [notification] = await listNotifications(userId);
    expect(notification?.type).toBe("verificacion_rechazada");
    expect(notification?.body).toContain("Patente vencida");
  });
});
