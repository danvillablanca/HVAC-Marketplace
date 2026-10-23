import { describe, expect, it } from "vitest";
import type { NearbySearchInput } from "@hvac/shared";
import {
  addDemoReview,
  demoProviders,
  distanceMeters,
  getDemoProvider,
  getDemoReviews,
  listDemoProviders,
  searchDemoProviders,
} from "./demo";

const SANTIAGO = { lat: -33.4489, lng: -70.6693 };
const CONCEPCION = { lat: -36.8269, lng: -73.0498 };

function searchInput(overrides: Partial<NearbySearchInput> = {}): NearbySearchInput {
  return {
    lat: SANTIAGO.lat,
    lng: SANTIAGO.lng,
    radiusKm: 50,
    limit: 20,
    offset: 0,
    ...overrides,
  };
}

describe("distanceMeters", () => {
  it("devuelve 0 para el mismo punto", () => {
    expect(distanceMeters(SANTIAGO, SANTIAGO)).toBe(0);
  });

  it("calcula aproximadamente la distancia Santiago - Concepción", () => {
    const meters = distanceMeters(SANTIAGO, CONCEPCION);
    expect(meters).toBeGreaterThan(400_000);
    expect(meters).toBeLessThan(470_000);
  });

  it("es simétrica", () => {
    expect(distanceMeters(SANTIAGO, CONCEPCION)).toBeCloseTo(
      distanceMeters(CONCEPCION, SANTIAGO),
      6,
    );
  });
});

describe("getDemoProvider", () => {
  it("encuentra por id", () => {
    const provider = getDemoProvider("p-clima-andes");
    expect(provider?.legalName).toBe("Clima Andes SpA");
  });

  it("encuentra por slug (igual al id)", () => {
    const provider = getDemoProvider("p-frio-sur");
    expect(provider?.id).toBe("p-frio-sur");
  });

  it("devuelve undefined si no existe", () => {
    expect(getDemoProvider("p-no-existe")).toBeUndefined();
  });
});

describe("getDemoReviews", () => {
  it("devuelve las reseñas de un proveedor conocido", () => {
    const reviews = getDemoReviews("p-clima-andes");
    expect(reviews).toHaveLength(2);
    expect(reviews[0]?.providerId).toBe("p-clima-andes");
  });

  it("devuelve arreglo vacío para un proveedor sin reseñas", () => {
    expect(getDemoReviews("p-no-existe")).toEqual([]);
  });
});

describe("addDemoReview", () => {
  it("agrega la reseña e incrementa reviewsCount del proveedor", () => {
    const provider = getDemoProvider("p-calor-central");
    expect(provider).toBeDefined();
    const before = provider?.reviewsCount ?? 0;
    const beforeReviews = getDemoReviews("p-calor-central").length;

    const review = addDemoReview({
      id: "review-nueva",
      providerId: "p-calor-central",
      rating: 5,
      comment: "Excelente servicio",
      authorName: "Cliente",
      createdAt: new Date().toISOString(),
      verified: false,
    });

    expect(review.id).toBe("review-nueva");
    expect(getDemoReviews("p-calor-central")).toHaveLength(beforeReviews + 1);
    expect(getDemoProvider("p-calor-central")?.reviewsCount).toBe(before + 1);
  });

  it("guarda la reseña aunque el proveedor no exista", () => {
    const review = addDemoReview({
      id: "review-huerfana",
      providerId: "p-desconocido",
      rating: 4,
      comment: null,
      authorName: "Cliente",
      createdAt: new Date().toISOString(),
      verified: false,
    });

    expect(getDemoReviews("p-desconocido")).toContainEqual(review);
  });
});

describe("searchDemoProviders", () => {
  it("incluye proveedores dentro del radio y excluye los de fuera", () => {
    const nearConcepcion = searchDemoProviders(
      searchInput({ lat: CONCEPCION.lat, lng: CONCEPCION.lng, radiusKm: 10 }),
    );
    expect(nearConcepcion.map((provider) => provider.id)).toContain("p-aire-bio");
    expect(nearConcepcion.map((provider) => provider.id)).not.toContain("p-clima-andes");

    const nearSantiago = searchDemoProviders(searchInput({ radiusKm: 50 }));
    expect(nearSantiago.map((provider) => provider.id)).not.toContain("p-aire-bio");
  });

  it("filtra por segment", () => {
    const results = searchDemoProviders(searchInput({ segment: "industrial" }));
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((provider) => provider.segment === "industrial")).toBe(true);
    const ids = results.map((provider) => provider.id);
    expect(ids).toContain("p-clima-andes");
    expect(ids).not.toContain("p-frio-sur");
  });

  it("filtra por query", () => {
    const results = searchDemoProviders(searchInput({ query: "split" }));
    expect(results.map((provider) => provider.id)).toEqual(["p-hogar-fresco"]);
  });

  it("ordena por distancia ascendente", () => {
    const results = searchDemoProviders(searchInput({ radiusKm: 50 }));
    expect(results[0]?.id).toBe("p-clima-andes");
    const distances = results.map((provider) => provider.distanceMeters ?? 0);
    const sorted = [...distances].sort((a, b) => a - b);
    expect(distances).toEqual(sorted);
  });

  it("pagina con limit y offset", () => {
    const first = searchDemoProviders(searchInput({ radiusKm: 50, limit: 2, offset: 0 }));
    const second = searchDemoProviders(searchInput({ radiusKm: 50, limit: 2, offset: 2 }));

    expect(first).toHaveLength(2);
    expect(second).toHaveLength(2);
    const firstIds = first.map((provider) => provider.id);
    const secondIds = second.map((provider) => provider.id);
    expect(firstIds.some((id) => secondIds.includes(id))).toBe(false);
  });
});

describe("listDemoProviders", () => {
  it("devuelve el total y pagina los resultados", () => {
    const page = listDemoProviders({ limit: 3, offset: 0 });
    expect(page.total).toBe(demoProviders.length);
    expect(page.items).toHaveLength(3);
    expect(page.items[0]?.id).toBe("p-hogar-fresco");
  });

  it("ordena por rating descendente y no repite entre páginas", () => {
    const first = listDemoProviders({ limit: 3, offset: 0 });
    const second = listDemoProviders({ limit: 3, offset: 3 });
    const firstIds = first.items.map((provider) => provider.id);
    const secondIds = second.items.map((provider) => provider.id);

    expect(firstIds.some((id) => secondIds.includes(id))).toBe(false);
    const ratings = first.items.map((provider) => provider.ratingAvg ?? 0);
    expect(ratings).toEqual([...ratings].sort((a, b) => b - a));
  });

  it("filtra por segment", () => {
    const page = listDemoProviders({ segment: "comercial", limit: 20, offset: 0 });
    expect(page.total).toBe(3);
    expect(page.items.every((provider) => provider.segment === "comercial")).toBe(true);
  });

  it("filtra por query", () => {
    const page = listDemoProviders({ query: "solar", limit: 20, offset: 0 });
    expect(page.total).toBe(1);
    expect(page.items[0]?.id).toBe("p-solar-verde");
  });
});
