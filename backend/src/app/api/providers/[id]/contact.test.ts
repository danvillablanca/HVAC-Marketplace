import { describe, expect, it } from "vitest";
import { jsonRequest, withId } from "@/test/http";
import { saveMyProfile } from "@/services/provider-profile";
import { SERVICE_CATALOG, providerProfileSchema } from "@hvac/shared";
import { GET } from "./route";

async function detail(id: string, options: Parameters<typeof jsonRequest>[3]) {
  const res = await GET(jsonRequest("GET", `/api/providers/${id}`, undefined, options), withId(id));
  return (await res.json()).data;
}

describe("PR-011 RN-10 contacto del proveedor", () => {
  it("anonimo y cliente sin cotizacion aceptada no ven telefono ni correo", async () => {
    for (const options of [{ noAuth: true }, { role: "cliente" as const }]) {
      const provider = await detail("p-clima-andes", options);
      expect(provider.contactHidden).toBe(true);
      expect(provider.phone).toBeNull();
      expect(provider.email).toBeNull();
      expect(provider.legalName).toBe("Clima Andes SpA");
    }
  });

  it("el admin ve el contacto", async () => {
    const provider = await detail("p-clima-andes", { role: "admin" });
    expect(provider.contactHidden).toBe(false);
    expect(provider.phone).toBeTruthy();
  });

  it("el proveedor ve su propio contacto", async () => {
    const saved = await saveMyProfile(
      "test-proveedor",
      providerProfileSchema.parse({
        legalName: "Contacto Propio SpA",
        rut: "76.123.456-0",
        segment: "residencial",
        phone: "+56 9 2222 3333",
        email: "propio@test.cl",
        commune: "Macul",
        coverageRadiusKm: 10,
        services: [{ serviceId: SERVICE_CATALOG[0].id }],
      }),
    );
    const provider = await detail(saved.id, { role: "proveedor" });
    expect(provider.contactHidden).toBe(false);
    expect(provider.email).toBe("propio@test.cl");
  });
});
