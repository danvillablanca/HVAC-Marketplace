import { SERVICE_CATALOG, providerProfileSchema, type ProviderProfileInput } from "@hvac/shared";
import { requestVerification, saveMyProfile } from "@/services/provider-profile";
import { decideVerification } from "@/services/verification";

/** Crea (modo demo) un proveedor verificado para el usuario indicado. */
export async function verifiedDemoProvider(
  userId: string,
  overrides: Partial<ProviderProfileInput> = {},
) {
  const input = providerProfileSchema.parse({
    legalName: `Proveedor ${userId}`,
    rut: "76.123.456-0",
    segment: "residencial",
    phone: "+56 9 1111 2222",
    email: `${userId}@test.cl`,
    commune: "Santiago",
    coverageRadiusKm: 30,
    services: SERVICE_CATALOG.map((s) => ({ serviceId: s.id })),
    ...overrides,
  });
  const saved = await saveMyProfile(userId, input);
  await requestVerification(userId, { documents: ["RUT y patente comercial"] });
  await decideVerification({ providerId: saved.id, decision: "verificado" }, "admin-test");
  return saved;
}
