import type {
  Appointment,
  AppointmentStatus,
  Lead,
  LeadStatus,
  ProviderDetail,
  ProviderSummary,
  ProviderVerificationStatus,
  Review,
  ServiceSegment,
} from "@hvac/shared";

type Row = Record<string, any>;

function mapServices(row: Row): ProviderDetail["servicesDetailed"] {
  const raw = Array.isArray(row.provider_services) ? row.provider_services : [];
  return raw.map((service: Row) => ({
    id: String(service.id ?? service.service_id ?? ""),
    name: String(service.name ?? ""),
    priceFrom: service.price_from ?? service.priceFrom ?? null,
    unit: service.unit ?? null,
  }));
}

function minPrice(services: ProviderDetail["servicesDetailed"]): number | null {
  const prices = services
    .map((service) => service.priceFrom)
    .filter((price): price is number => typeof price === "number");
  return prices.length > 0 ? Math.min(...prices) : null;
}

export function mapProviderSummaryRow(
  row: Row,
  distanceMeters: number | null = null,
): ProviderSummary {
  const services = mapServices(row);
  return {
    id: String(row.id),
    legalName: String(row.legal_name ?? row.legalName ?? ""),
    slug: String(row.slug ?? row.id ?? ""),
    segment: (row.segment ?? "residencial") as ServiceSegment,
    verificationStatus: (row.verification_status ??
      row.verificationStatus ??
      "pendiente") as ProviderVerificationStatus,
    ratingAvg: row.rating_avg ?? row.ratingAvg ?? null,
    reviewsCount: Number(row.reviews_count ?? row.reviewsCount ?? 0),
    city: row.city ?? row.commune ?? null,
    commune: row.commune ?? null,
    distanceMeters: row.distance_meters ?? row.distanceMeters ?? distanceMeters,
    location:
      row.lat != null && row.lng != null
        ? { lat: Number(row.lat), lng: Number(row.lng) }
        : (row.location ?? null),
    services: services.map((service) => service.name),
    priceFrom: row.price_from ?? row.priceFrom ?? minPrice(services),
    isDemo: Boolean(row.is_demo ?? row.isDemo ?? false),
  };
}

export function mapProviderRow(row: Row): ProviderDetail {
  const summary = mapProviderSummaryRow(row);
  return {
    ...summary,
    rut: String(row.rut ?? ""),
    email: row.email ?? null,
    phone: row.phone ?? null,
    description: row.description ?? null,
    address: row.address ?? null,
    location:
      row.lat != null && row.lng != null
        ? { lat: Number(row.lat), lng: Number(row.lng) }
        : (row.location ?? null),
    modalities: Array.isArray(row.modalities) ? (row.modalities as string[]) : [],
    servicesDetailed: mapServices(row),
  };
}

export function mapReviewRow(row: Row): Review {
  return {
    id: String(row.id),
    providerId: String(row.provider_id ?? row.providerId ?? ""),
    rating: Number(row.rating ?? 0),
    comment: row.comment ?? null,
    authorName: String(row.author_name ?? row.authorName ?? "Cliente"),
    createdAt: String(row.created_at ?? row.createdAt ?? new Date().toISOString()),
    verified: Boolean(row.verified),
  };
}

export function mapLeadRow(row: Row): Lead {
  return {
    id: String(row.id),
    clientId: String(row.client_id ?? row.clientId ?? ""),
    providerId: String(row.provider_id ?? row.providerId ?? ""),
    serviceId: row.service_id ?? row.serviceId ?? null,
    description: String(row.description ?? ""),
    status: (row.status ?? "nuevo") as LeadStatus,
    createdAt: String(row.created_at ?? row.createdAt ?? new Date().toISOString()),
  };
}

export function mapAppointmentRow(row: Row): Appointment {
  return {
    id: String(row.id),
    leadId: String(row.lead_id ?? row.leadId ?? ""),
    startsAt: String(row.starts_at ?? row.startsAt ?? new Date().toISOString()),
    status: (row.status ?? "propuesta") as AppointmentStatus,
  };
}
