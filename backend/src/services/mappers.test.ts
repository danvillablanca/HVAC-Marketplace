import { describe, expect, it } from "vitest";
import {
  mapAppointmentRow,
  mapLeadRow,
  mapProviderRow,
  mapProviderSummaryRow,
  mapReviewRow,
} from "./mappers";

const providerRow = {
  id: "prov-1",
  legal_name: "Clima Andes SpA",
  slug: "clima-andes",
  segment: "industrial",
  verification_status: "verificado",
  rating_avg: 4.8,
  reviews_count: 132,
  city: "Santiago",
  commune: "Quinta Normal",
  lat: -33.4325,
  lng: -70.7005,
  price_from: 95000,
  is_demo: true,
  rut: "76.543.210-K",
  email: "contacto@climaandes.cl",
  phone: "+56973337025",
  description: "Ingeniería HVAC industrial",
  address: "Lope de Ulloa 1760, Quinta Normal",
  modalities: ["Visita a domicilio", "Garantía escrita"],
  provider_services: [
    { id: "svc-1", name: "Ventilación industrial", price_from: 180000, unit: "visita" },
    { id: "svc-2", name: "Montaje y mantenimiento", price_from: 95000, unit: null },
  ],
};

describe("mapProviderSummaryRow", () => {
  it("mapea una fila cruda de Supabase a ProviderSummary", () => {
    const summary = mapProviderSummaryRow(providerRow);

    expect(summary).toEqual({
      id: "prov-1",
      legalName: "Clima Andes SpA",
      slug: "clima-andes",
      segment: "industrial",
      verificationStatus: "verificado",
      ratingAvg: 4.8,
      reviewsCount: 132,
      city: "Santiago",
      commune: "Quinta Normal",
      distanceMeters: null,
      location: { lat: -33.4325, lng: -70.7005 },
      services: ["Ventilación industrial", "Montaje y mantenimiento"],
      priceFrom: 95000,
      isDemo: true,
    });
  });

  it("usa la distancia entregada como parámetro y respeta distance_meters de la fila", () => {
    expect(mapProviderSummaryRow(providerRow, 1234).distanceMeters).toBe(1234);
    expect(
      mapProviderSummaryRow({ ...providerRow, distance_meters: 500 }, 1234).distanceMeters,
    ).toBe(500);
  });

  it("calcula priceFrom como el mínimo de los servicios cuando no viene en la fila", () => {
    const { price_from: _ignored, ...rest } = providerRow;
    expect(mapProviderSummaryRow(rest).priceFrom).toBe(95000);
  });

  it("devuelve priceFrom null si no hay precios", () => {
    expect(mapProviderSummaryRow({ id: "x" }).priceFrom).toBeNull();
  });

  it("aplica defaults de segment y verificationStatus", () => {
    const summary = mapProviderSummaryRow({ id: "x" });
    expect(summary.segment).toBe("residencial");
    expect(summary.verificationStatus).toBe("pendiente");
    expect(summary.legalName).toBe("");
    expect(summary.slug).toBe("x");
    expect(summary.reviewsCount).toBe(0);
    expect(summary.isDemo).toBe(false);
  });
});

describe("mapProviderRow", () => {
  it("incluye campos de detalle y servicesDetailed", () => {
    const detail = mapProviderRow(providerRow);

    expect(detail.rut).toBe("76.543.210-K");
    expect(detail.email).toBe("contacto@climaandes.cl");
    expect(detail.phone).toBe("+56973337025");
    expect(detail.description).toBe("Ingeniería HVAC industrial");
    expect(detail.address).toBe("Lope de Ulloa 1760, Quinta Normal");
    expect(detail.modalities).toEqual(["Visita a domicilio", "Garantía escrita"]);
    expect(detail.location).toEqual({ lat: -33.4325, lng: -70.7005 });
    expect(detail.servicesDetailed).toEqual([
      { id: "svc-1", name: "Ventilación industrial", priceFrom: 180000, unit: "visita" },
      { id: "svc-2", name: "Montaje y mantenimiento", priceFrom: 95000, unit: null },
    ]);
  });

  it("usa defaults para filas incompletas", () => {
    const detail = mapProviderRow({ id: "x" });
    expect(detail.rut).toBe("");
    expect(detail.modalities).toEqual([]);
    expect(detail.servicesDetailed).toEqual([]);
    expect(detail.location).toBeNull();
  });
});

describe("mapReviewRow", () => {
  it("mapea una fila cruda de reseña", () => {
    const review = mapReviewRow({
      id: "r1",
      provider_id: "prov-1",
      rating: "5",
      comment: "Muy bueno",
      author_name: "Rodrigo M.",
      created_at: "2026-08-14T15:00:00.000Z",
      verified: 1,
    });

    expect(review).toEqual({
      id: "r1",
      providerId: "prov-1",
      rating: 5,
      comment: "Muy bueno",
      authorName: "Rodrigo M.",
      createdAt: "2026-08-14T15:00:00.000Z",
      verified: true,
    });
  });

  it("aplica defaults en filas mínimas", () => {
    const review = mapReviewRow({ id: "r2" });
    expect(review.providerId).toBe("");
    expect(review.rating).toBe(0);
    expect(review.comment).toBeNull();
    expect(review.authorName).toBe("Cliente");
    expect(review.verified).toBe(false);
    expect(Number.isNaN(Date.parse(review.createdAt))).toBe(false);
  });
});

describe("mapLeadRow", () => {
  it("mapea una fila cruda de solicitud", () => {
    const lead = mapLeadRow({
      id: "l1",
      client_id: "c1",
      provider_id: "prov-1",
      service_id: "svc-1",
      description: "Necesito mantención anual",
      status: "contactado",
      created_at: "2026-09-01T10:00:00.000Z",
    });

    expect(lead).toEqual({
      id: "l1",
      clientId: "c1",
      providerId: "prov-1",
      serviceId: "svc-1",
      description: "Necesito mantención anual",
      status: "contactado",
      createdAt: "2026-09-01T10:00:00.000Z",
    });
  });

  it("aplica defaults", () => {
    const lead = mapLeadRow({ id: "l2" });
    expect(lead.clientId).toBe("");
    expect(lead.providerId).toBe("");
    expect(lead.serviceId).toBeNull();
    expect(lead.description).toBe("");
    expect(lead.status).toBe("nuevo");
  });
});

describe("mapAppointmentRow", () => {
  it("mapea una fila cruda de cita", () => {
    const appointment = mapAppointmentRow({
      id: "a1",
      lead_id: "l1",
      starts_at: "2026-09-10T14:00:00.000Z",
      status: "confirmada",
    });

    expect(appointment).toEqual({
      id: "a1",
      leadId: "l1",
      startsAt: "2026-09-10T14:00:00.000Z",
      status: "confirmada",
    });
  });

  it("aplica defaults", () => {
    const appointment = mapAppointmentRow({ id: "a2" });
    expect(appointment.leadId).toBe("");
    expect(appointment.status).toBe("propuesta");
  });
});
