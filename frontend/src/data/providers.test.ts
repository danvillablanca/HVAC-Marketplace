import { describe, it, expect } from "vitest";
import { DEMO_PROVIDERS, DEMO_REVIEWS, findDemoProvider } from "./providers";

describe("DEMO_PROVIDERS", () => {
  it("contiene 10 proveedores", () => {
    expect(DEMO_PROVIDERS).toHaveLength(10);
  });

  it("tiene ids unicos", () => {
    const ids = DEMO_PROVIDERS.map((provider) => provider.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("todos tienen location con lat/lng numericos", () => {
    for (const provider of DEMO_PROVIDERS) {
      expect(provider.location).toBeTruthy();
      expect(typeof provider.location?.lat).toBe("number");
      expect(typeof provider.location?.lng).toBe("number");
    }
  });

  it("todos tienen priceFrom numerico o null", () => {
    for (const provider of DEMO_PROVIDERS) {
      expect(provider.priceFrom === null || typeof provider.priceFrom === "number").toBe(true);
    }
  });

  it("marca los datos demo con isDemo y slug igual al id", () => {
    for (const provider of DEMO_PROVIDERS) {
      expect(provider.isDemo).toBe(true);
      expect(provider.slug).toBe(provider.id);
    }
  });
});

describe("findDemoProvider", () => {
  it("encuentra por id", () => {
    const provider = findDemoProvider("p-clima-andes");
    expect(provider?.legalName).toBe("Clima Andes SpA");
  });

  it("encuentra por slug", () => {
    const slug = DEMO_PROVIDERS[0]!.slug;
    expect(findDemoProvider(slug)?.id).toBe(DEMO_PROVIDERS[0]!.id);
  });

  it("devuelve undefined para un id inexistente", () => {
    expect(findDemoProvider("p-no-existe")).toBeUndefined();
  });
});

describe("DEMO_REVIEWS", () => {
  it("cada entrada referencia al proveedor de su clave", () => {
    for (const [providerId, reviews] of Object.entries(DEMO_REVIEWS)) {
      expect(reviews.length).toBeGreaterThan(0);
      for (const review of reviews) {
        expect(review.providerId).toBe(providerId);
      }
    }
  });
});
