import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@/test/render";
import type { ProviderDetail } from "@hvac/shared";
import { setDocumentTitle, useDocumentTitle, providerJsonLd } from "./seo";

function makeProvider(overrides: Partial<ProviderDetail> = {}): ProviderDetail {
  return {
    id: "p1",
    legalName: "Frío SpA",
    slug: "frio-spa",
    segment: "residencial",
    verificationStatus: "verificado",
    ratingAvg: null,
    reviewsCount: 0,
    city: null,
    commune: null,
    distanceMeters: null,
    location: null,
    services: [],
    priceFrom: null,
    isDemo: false,
    rut: "76.123.456-7",
    email: null,
    phone: null,
    description: null,
    address: null,
    modalities: [],
    servicesDetailed: [],
    ...overrides,
  };
}

describe("lib/seo", () => {
  describe("setDocumentTitle", () => {
    afterEach(() => {
      document.title = "";
    });

    it("agrega el nombre del sitio al título", () => {
      setDocumentTitle("Proveedores");
      expect(document.title).toBe("Proveedores | Marketplace HVAC");
    });

    it("usa solo el nombre del sitio con título vacío", () => {
      document.title = "algo";
      setDocumentTitle("");
      expect(document.title).toBe("Marketplace HVAC");
    });
  });

  describe("useDocumentTitle", () => {
    let original: string;

    beforeEach(() => {
      original = document.title;
    });

    afterEach(() => {
      document.title = original;
    });

    it("sincroniza el título al montar", () => {
      renderHook(() => useDocumentTitle("Tabs"));
      expect(document.title).toBe("Tabs | Marketplace HVAC");
    });

    it("actualiza el título cuando cambia", () => {
      const { rerender } = renderHook(({ title }) => useDocumentTitle(title), {
        initialProps: { title: "Uno" },
      });
      expect(document.title).toBe("Uno | Marketplace HVAC");

      act(() => rerender({ title: "Dos" }));
      expect(document.title).toBe("Dos | Marketplace HVAC");
    });

    it("restaura el título previo al desmontar", () => {
      document.title = "Anterior";
      const { unmount } = renderHook(() => useDocumentTitle("Detalle"));
      expect(document.title).toBe("Detalle | Marketplace HVAC");

      unmount();
      expect(document.title).toBe("Anterior");
    });
  });

  describe("providerJsonLd", () => {
    it("construye el mínimo con el nombre y tipo", () => {
      const jsonLd = providerJsonLd(makeProvider());

      expect(jsonLd["@context"]).toBe("https://schema.org");
      expect(jsonLd["@type"]).toBe("LocalBusiness");
      expect(jsonLd.name).toBe("Frío SpA");
      expect(jsonLd.description).toBeUndefined();
      expect(jsonLd.telephone).toBeUndefined();
      expect(jsonLd.email).toBeUndefined();
      expect(jsonLd.address).toBeUndefined();
      expect(jsonLd.geo).toBeUndefined();
      expect(jsonLd.aggregateRating).toBeUndefined();
      expect(jsonLd.priceRange).toBeUndefined();
      expect(jsonLd.areaServed).toBeUndefined();
    });

    it("incluye descripción, teléfono y email cuando existen", () => {
      const jsonLd = providerJsonLd(
        makeProvider({
          description: "Instalación de aire acondicionado",
          phone: "+56911112222",
          email: "contacto@frio.cl",
        }),
      );

      expect(jsonLd.description).toBe("Instalación de aire acondicionado");
      expect(jsonLd.telephone).toBe("+56911112222");
      expect(jsonLd.email).toBe("contacto@frio.cl");
    });

    it("construye la dirección priorizando la comuna sobre la ciudad", () => {
      const jsonLd = providerJsonLd(
        makeProvider({ address: "Av. Siempre Viva 123", commune: "Providencia", city: "Santiago" }),
      );

      expect(jsonLd.address).toEqual({
        "@type": "PostalAddress",
        addressCountry: "CL",
        streetAddress: "Av. Siempre Viva 123",
        addressLocality: "Providencia",
      });
      expect(jsonLd.areaServed).toBe("Providencia");
    });

    it("usa la ciudad como localidad y área cuando no hay comuna", () => {
      const jsonLd = providerJsonLd(makeProvider({ city: "Valparaíso" }));

      expect(jsonLd.address).toEqual({
        "@type": "PostalAddress",
        addressCountry: "CL",
        addressLocality: "Valparaíso",
      });
      expect(jsonLd.areaServed).toBe("Valparaíso");
    });

    it("agrega coordenadas cuando hay location", () => {
      const jsonLd = providerJsonLd(makeProvider({ location: { lat: -33.45, lng: -70.66 } }));

      expect(jsonLd.geo).toEqual({
        "@type": "GeoCoordinates",
        latitude: -33.45,
        longitude: -70.66,
      });
    });

    it("agrega aggregateRating solo con rating y reseñas", () => {
      const jsonLd = providerJsonLd(makeProvider({ ratingAvg: 4.7, reviewsCount: 21 }));
      expect(jsonLd.aggregateRating).toEqual({
        "@type": "AggregateRating",
        ratingValue: 4.7,
        reviewCount: 21,
      });

      const sinReviews = providerJsonLd(makeProvider({ ratingAvg: 4.7, reviewsCount: 0 }));
      expect(sinReviews.aggregateRating).toBeUndefined();

      const sinRating = providerJsonLd(makeProvider({ ratingAvg: null, reviewsCount: 5 }));
      expect(sinRating.aggregateRating).toBeUndefined();
    });

    it("agrega priceRange cuando hay precio desde", () => {
      const conPrecio = providerJsonLd(makeProvider({ priceFrom: 35000 }));
      expect(conPrecio.priceRange).toBe("Desde $35000");

      const sinPrecio = providerJsonLd(makeProvider({ priceFrom: null }));
      expect(sinPrecio.priceRange).toBeUndefined();
    });
  });
});
