import { useEffect } from "react";
import type { ProviderDetail } from "@hvac/shared";

const SITE_NAME = "Marketplace HVAC";

/** Asigna el titulo del documento agregando el nombre del sitio. */
export function setDocumentTitle(title: string): void {
  document.title = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
}

/** Efecto que sincroniza el titulo del documento y lo restaura al desmontar. */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const previous = document.title;
    setDocumentTitle(title);
    return () => {
      document.title = previous;
    };
  }, [title]);
}

export interface LocalBusinessJsonLd {
  "@context": "https://schema.org";
  "@type": "LocalBusiness";
  name: string;
  description?: string;
  telephone?: string;
  email?: string;
  address?: {
    "@type": "PostalAddress";
    streetAddress?: string;
    addressLocality?: string;
    addressCountry: string;
  };
  geo?: {
    "@type": "GeoCoordinates";
    latitude: number;
    longitude: number;
  };
  aggregateRating?: {
    "@type": "AggregateRating";
    ratingValue: number;
    reviewCount: number;
  };
  priceRange?: string;
  areaServed?: string;
}

/** Construye un objeto JSON-LD LocalBusiness a partir del detalle de un proveedor. */
export function providerJsonLd(provider: ProviderDetail): LocalBusinessJsonLd {
  const jsonLd: LocalBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: provider.legalName,
  };

  if (provider.description) jsonLd.description = provider.description;
  if (provider.phone) jsonLd.telephone = provider.phone;
  if (provider.email) jsonLd.email = provider.email;

  if (provider.address || provider.commune || provider.city) {
    const address: NonNullable<LocalBusinessJsonLd["address"]> = {
      "@type": "PostalAddress",
      addressCountry: "CL",
    };
    if (provider.address) address.streetAddress = provider.address;
    const locality = provider.commune ?? provider.city;
    if (locality) address.addressLocality = locality;
    jsonLd.address = address;
  }

  if (provider.location) {
    jsonLd.geo = {
      "@type": "GeoCoordinates",
      latitude: provider.location.lat,
      longitude: provider.location.lng,
    };
  }

  if (provider.ratingAvg !== null && provider.reviewsCount > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: provider.ratingAvg,
      reviewCount: provider.reviewsCount,
    };
  }

  if (provider.priceFrom !== null) jsonLd.priceRange = `Desde $${provider.priceFrom}`;

  const areaServed = provider.commune ?? provider.city;
  if (areaServed) jsonLd.areaServed = areaServed;

  return jsonLd;
}
