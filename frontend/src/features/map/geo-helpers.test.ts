import { describe, it, expect, vi, afterEach } from "vitest";
import {
  buildCircle,
  initials,
  resolveCssColor,
  SEGMENT_COLORS,
  VERIFICATION_COLORS,
} from "./geo-helpers";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("buildCircle", () => {
  const center = { lat: -33.4489, lng: -70.6693 };

  it("genera un Polygon cerrado con N+1 puntos", () => {
    const data = buildCircle(center, 10, 8);
    const ring = data.features[0].geometry.coordinates[0];

    expect(data.type).toBe("FeatureCollection");
    expect(data.features).toHaveLength(1);
    expect(data.features[0].geometry.type).toBe("Polygon");
    expect(ring).toHaveLength(9);
    expect(ring[0]).toEqual(ring[ring.length - 1]);
  });

  it("usa 72 pasos por defecto (73 puntos)", () => {
    const ring = buildCircle(center, 5).features[0].geometry.coordinates[0];
    expect(ring).toHaveLength(73);
  });

  it("contiene el centro de forma aproximada (centroide del anillo)", () => {
    const ring = buildCircle(center, 12, 64).features[0].geometry.coordinates[0];
    const unique = ring.slice(0, -1);
    const avgLng = unique.reduce((sum, p) => sum + p[0], 0) / unique.length;
    const avgLat = unique.reduce((sum, p) => sum + p[1], 0) / unique.length;

    expect(avgLng).toBeCloseTo(center.lng, 6);
    expect(avgLat).toBeCloseTo(center.lat, 6);
  });

  it("el radio crece con radiusKm", () => {
    const small = buildCircle(center, 5, 16).features[0].geometry.coordinates[0];
    const big = buildCircle(center, 25, 16).features[0].geometry.coordinates[0];
    const spread = (ring: [number, number][]) =>
      Math.max(...ring.map((p) => p[1])) - Math.min(...ring.map((p) => p[1]));

    expect(spread(big)).toBeGreaterThan(spread(small));
  });
});

describe("initials", () => {
  it("usa las dos primeras palabras", () => {
    expect(initials("Clima Andes SpA")).toBe("CA");
  });

  it("funciona con una sola palabra", () => {
    expect(initials("Refricentral")).toBe("R");
  });

  it("ignora espacios internos multiples", () => {
    expect(initials("Maestranza   Frio Ltda.")).toBe("MF");
  });

  it("devuelve un bullet si no hay letras", () => {
    expect(initials("")).toBe("•");
    expect(initials("   ")).toBe("•");
  });
});

describe("resolveCssColor", () => {
  it("devuelve el valor tal cual cuando es un hex", () => {
    expect(resolveCssColor("#7c3aed", "#000000")).toBe("#7c3aed");
  });

  it("resuelve tokens var(--x) usando getComputedStyle", () => {
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      getPropertyValue: vi.fn().mockReturnValue("  rgb(14, 165, 201)  "),
    } as unknown as CSSStyleDeclaration);

    expect(resolveCssColor("var(--primary)", "#0ea5c9")).toBe("rgb(14, 165, 201)");
  });

  it("usa el fallback cuando el token no resuelve", () => {
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      getPropertyValue: vi.fn().mockReturnValue(""),
    } as unknown as CSSStyleDeclaration);

    expect(resolveCssColor("var(--missing)", "#abcdef")).toBe("#abcdef");
  });
});

describe("mapas de color", () => {
  it("cubren todos los segmentos y estados", () => {
    expect(Object.keys(SEGMENT_COLORS).sort()).toEqual(["comercial", "industrial", "residencial"]);
    expect(Object.keys(VERIFICATION_COLORS).sort()).toEqual([
      "en_revision",
      "pendiente",
      "rechazado",
      "verificado",
    ]);
  });
});
