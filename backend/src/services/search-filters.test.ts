import { describe, expect, it } from "vitest";
import { SERVICE_CATALOG, nearbySearchSchema } from "@hvac/shared";
import { getMyProfile } from "./provider-profile";
import { searchNearby } from "./providers";
import { verifiedDemoProvider } from "@/test/providers";

const SANTIAGO = { lat: -33.4489, lng: -70.6693 };
const search = (extra: Record<string, unknown> = {}) =>
  searchNearby(nearbySearchSchema.parse({ ...SANTIAGO, radiusKm: 50, ...extra }));

describe("PR-016..PR-019 busqueda (modo demo)", () => {
  it("BUS-02: el radio por defecto es 10 km y la pagina trae 10 resultados", () => {
    const input = nearbySearchSchema.parse(SANTIAGO);
    expect(input.radiusKm).toBe(10);
    expect(input.limit).toBe(10);
  });

  it("PR-018 pagina con total estable", async () => {
    const first = await search({ limit: 2, offset: 0 });
    const second = await search({ limit: 2, offset: 2 });
    expect(first.items).toHaveLength(2);
    expect(first.total).toBeGreaterThan(2);
    expect(second.total).toBe(first.total);
    expect(second.items.map((p) => p.id)).not.toEqual(first.items.map((p) => p.id));
  });

  it("PR-018 filtra por calificacion minima y ordena por calificacion", async () => {
    const { items } = await search({ minRating: 4.7, sort: "rating" });
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((p) => (p.ratingAvg ?? 0) >= 4.7)).toBe(true);
    const ratings = items.map((p) => p.ratingAvg ?? 0);
    expect(ratings).toEqual([...ratings].sort((a, b) => b - a));
  });

  it("PR-018 filtra por servicio del catalogo", async () => {
    const split = SERVICE_CATALOG[1];
    const { items } = await search({ serviceId: split.id });
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((p) => p.services.some((s) => s.toLowerCase().includes("split")))).toBe(
      true,
    );
  });

  it("PR-012/PR-018 'solo disponibles' excluye a quien se marco no disponible", async () => {
    const saved = await verifiedDemoProvider("busqueda-no-disponible", {
      legalName: "No Disponible Ltda.",
      commune: "Santiago",
      isAvailable: false,
    });
    expect((await search()).items.some((p) => p.id === saved.id)).toBe(true);
    expect((await search({ onlyAvailable: true })).items.some((p) => p.id === saved.id)).toBe(
      false,
    );
  });

  it("PR-017 BUS-02 respeta el radio de cobertura del proveedor", async () => {
    const saved = await verifiedDemoProvider("busqueda-cobertura", {
      legalName: "Cobertura Corta SpA",
      commune: "Lo Barnechea",
      coverageRadiusKm: 5,
    });
    expect((await search({ radiusKm: 30 })).items.some((p) => p.id === saved.id)).toBe(false);
    const fromBarnechea = await searchNearby(
      nearbySearchSchema.parse({ lat: -33.35, lng: -70.518, radiusKm: 10 }),
    );
    expect(fromBarnechea.items.some((p) => p.id === saved.id)).toBe(true);
  });

  it("Hogar Fresco no aparece duplicado tras cargar el perfil demo del proveedor", async () => {
    await getMyProfile("demo-proveedor");
    const { items } = await search({ limit: 50 });
    expect(items.filter((p) => p.legalName === "Hogar Fresco Instalaciones")).toHaveLength(1);
  });
});
