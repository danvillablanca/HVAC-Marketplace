import { describe, expect, it } from "vitest";
import type { NearbySearchInput } from "@hvac/shared";
import { getProvider, listProviders, listReviews, searchNearby } from "./providers";

function searchInput(overrides: Partial<NearbySearchInput> = {}): NearbySearchInput {
  return {
    lat: -33.4489,
    lng: -70.6693,
    radiusKm: 50,
    limit: 20,
    offset: 0,
    ...overrides,
  };
}

describe("searchNearby (fallback demo)", () => {
  it("devuelve proveedores cercanos ordenados por distancia", async () => {
    const results = await searchNearby(searchInput());

    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.id).toBe("p-clima-andes");
    const distances = results.map((provider) => provider.distanceMeters ?? 0);
    expect(distances).toEqual([...distances].sort((a, b) => a - b));
  });

  it("respeta el filtro por segment y la paginación", async () => {
    const industrial = await searchNearby(searchInput({ segment: "industrial" }));
    expect(industrial.length).toBeGreaterThan(0);
    expect(industrial.every((provider) => provider.segment === "industrial")).toBe(true);

    const page = await searchNearby(searchInput({ limit: 2, offset: 0 }));
    expect(page).toHaveLength(2);
  });
});

describe("listProviders (fallback demo)", () => {
  it("devuelve items, total, limit y offset", async () => {
    const result = await listProviders({ limit: 3, offset: 0 });

    expect(result.items).toHaveLength(3);
    expect(result.total).toBe(10);
    expect(result.limit).toBe(3);
    expect(result.offset).toBe(0);
    expect(result.items[0]?.id).toBe("p-hogar-fresco");
  });

  it("filtra por segment", async () => {
    const result = await listProviders({ segment: "comercial", limit: 20, offset: 0 });
    expect(result.total).toBe(3);
    expect(result.items.every((provider) => provider.segment === "comercial")).toBe(true);
  });

  it("filtra por query", async () => {
    const result = await listProviders({ query: "solar", limit: 20, offset: 0 });
    expect(result.total).toBe(1);
    expect(result.items[0]?.id).toBe("p-solar-verde");
  });
});

describe("getProvider (fallback demo)", () => {
  it("obtiene el detalle por id/slug", async () => {
    const provider = await getProvider("p-clima-andes");

    expect(provider?.legalName).toBe("Clima Andes SpA");
    expect(provider?.isDemo).toBe(true);
    expect(provider?.servicesDetailed.length).toBeGreaterThan(0);
    expect(provider?.location).toEqual({ lat: -33.4325, lng: -70.7005 });
  });

  it("devuelve null para un proveedor inexistente", async () => {
    await expect(getProvider("p-no-existe")).resolves.toBeNull();
  });
});

describe("listReviews (fallback demo)", () => {
  it("lista las reseñas de un proveedor", async () => {
    const reviews = await listReviews("p-frio-sur");
    expect(reviews).toHaveLength(2);
    expect(reviews.every((review) => review.providerId === "p-frio-sur")).toBe(true);
  });

  it("devuelve arreglo vacío para proveedores sin reseñas", async () => {
    await expect(listReviews("p-aire-bio")).resolves.toEqual([]);
  });
});
