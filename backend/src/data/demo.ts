import type {
  GeoPoint,
  NearbySearchInput,
  ProviderDetail,
  ProviderSummary,
  ProviderVerificationStatus,
  Review,
  ServiceSegment,
} from "@hvac/shared";

interface DemoProviderInput {
  id: string;
  legalName: string;
  segment: ServiceSegment;
  verificationStatus: ProviderVerificationStatus;
  ratingAvg: number;
  reviewsCount: number;
  commune: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  email: string;
  description: string;
  modalities: string[];
  services: Array<{ name: string; priceFrom: number }>;
}

const EARTH_RADIUS_M = 6_371_000;

export function distanceMeters(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

function build(input: DemoProviderInput): ProviderDetail {
  const prices = input.services.map((service) => service.priceFrom);
  return {
    id: input.id,
    legalName: input.legalName,
    slug: input.id,
    segment: input.segment,
    verificationStatus: input.verificationStatus,
    ratingAvg: input.ratingAvg,
    reviewsCount: input.reviewsCount,
    city: input.commune,
    commune: input.commune,
    distanceMeters: null,
    services: input.services.map((service) => service.name),
    priceFrom: prices.length > 0 ? Math.min(...prices) : null,
    isDemo: true,
    rut: "76.543.210-K",
    email: input.email,
    phone: input.phone,
    description: input.description,
    address: input.address,
    location: { lat: input.lat, lng: input.lng },
    modalities: input.modalities,
    servicesDetailed: input.services.map((service, index) => ({
      id: `${input.id}-svc-${index}`,
      name: service.name,
      priceFrom: service.priceFrom,
      unit: "visita",
    })),
  };
}

export const demoProviders: ProviderDetail[] = [
  build({
    id: "p-clima-andes",
    legalName: "Clima Andes SpA",
    segment: "industrial",
    verificationStatus: "verificado",
    ratingAvg: 4.8,
    reviewsCount: 132,
    commune: "Quinta Normal",
    address: "Lope de Ulloa 1760, Quinta Normal",
    lat: -33.4325,
    lng: -70.7005,
    phone: "+56973337025",
    email: "contacto@climaandes.cl",
    description:
      "Ingeniería HVAC industrial: ventilación, centrales térmicas, salas limpias y montaje. Más de 10 años y certificación ASHRAE.",
    modalities: ["Visita a domicilio", "Atención de emergencia 24/7", "Garantía escrita"],
    services: [
      { name: "Ventilación industrial y comercial", priceFrom: 180000 },
      { name: "Centrales térmicas", priceFrom: 450000 },
      { name: "Montaje y mantenimiento", priceFrom: 95000 },
    ],
  }),
  build({
    id: "p-frio-sur",
    legalName: "Frío Sur Climatización Ltda.",
    segment: "comercial",
    verificationStatus: "verificado",
    ratingAvg: 4.6,
    reviewsCount: 88,
    commune: "Providencia",
    address: "Av. Providencia 1234, Providencia",
    lat: -33.426,
    lng: -70.614,
    phone: "+56987654321",
    email: "ventas@friosur.cl",
    description: "Aire acondicionado comercial y mantenimiento preventivo para oficinas y retail.",
    modalities: ["Visita a domicilio", "Presupuesto sin costo", "Boleta electrónica"],
    services: [
      { name: "Aire acondicionado comercial", priceFrom: 120000 },
      { name: "Inspección técnica HVAC", priceFrom: 60000 },
      { name: "Montaje y mantenimiento", priceFrom: 85000 },
    ],
  }),
  build({
    id: "p-hogar-fresco",
    legalName: "Hogar Fresco Instalaciones",
    segment: "residencial",
    verificationStatus: "verificado",
    ratingAvg: 4.9,
    reviewsCount: 210,
    commune: "La Florida",
    address: "Av. Vicuña Mackenna 5678, La Florida",
    lat: -33.5225,
    lng: -70.5983,
    phone: "+56911112222",
    email: "hola@hogarfresco.cl",
    description: "Especialistas en Split inverter: venta, instalación y carga de gas R32/R410.",
    modalities: ["Visita a domicilio", "Garantía escrita", "Presupuesto sin costo"],
    services: [
      { name: "Venta e instalación de equipos Split", priceFrom: 89990 },
      { name: "Reparación y carga de gas", priceFrom: 45000 },
      { name: "Aire acondicionado residencial", priceFrom: 110000 },
    ],
  }),
  build({
    id: "p-solar-verde",
    legalName: "Solar Verde Energía",
    segment: "residencial",
    verificationStatus: "verificado",
    ratingAvg: 4.7,
    reviewsCount: 64,
    commune: "Maipú",
    address: "Av. Pajaritos 2100, Maipú",
    lat: -33.5108,
    lng: -70.7575,
    phone: "+56933334444",
    email: "contacto@solarverde.cl",
    description: "Paneles solares y piscinas temperadas con enfoque de eficiencia energética.",
    modalities: ["Visita a domicilio", "Boleta electrónica", "Garantía escrita"],
    services: [
      { name: "Energía solar", priceFrom: 950000 },
      { name: "Piscinas temperadas", priceFrom: 780000 },
    ],
  }),
  build({
    id: "p-termica-norte",
    legalName: "Térmica Norte Ingeniería",
    segment: "industrial",
    verificationStatus: "en_revision",
    ratingAvg: 4.4,
    reviewsCount: 27,
    commune: "Antofagasta",
    address: "Av. Argentina 1500, Antofagasta",
    lat: -23.6509,
    lng: -70.3975,
    phone: "+56922223333",
    email: "proyectos@termicanorte.cl",
    description:
      "HVAC industrial para minería: ventilación forzada y refrigeración de salas eléctricas.",
    modalities: ["Visita a domicilio", "Atención de emergencia 24/7"],
    services: [
      { name: "Ventilación industrial y comercial", priceFrom: 250000 },
      { name: "Centrales térmicas", priceFrom: 520000 },
    ],
  }),
  build({
    id: "p-aire-bio",
    legalName: "Aire Bio Clima",
    segment: "comercial",
    verificationStatus: "verificado",
    ratingAvg: 4.5,
    reviewsCount: 51,
    commune: "Concepción",
    address: "O'Higgins 940, Concepción",
    lat: -36.8269,
    lng: -73.0498,
    phone: "+56944445555",
    email: "contacto@airebio.cl",
    description: "Climatización comercial, salas limpias y laboratorios en la región del Biobío.",
    modalities: ["Presupuesto sin costo", "Garantía escrita"],
    services: [
      { name: "Salas limpias y laboratorios", priceFrom: 320000 },
      { name: "Aire acondicionado comercial", priceFrom: 130000 },
    ],
  }),
  build({
    id: "p-calor-central",
    legalName: "Calor Central SpA",
    segment: "residencial",
    verificationStatus: "pendiente",
    ratingAvg: 4.2,
    reviewsCount: 19,
    commune: "Ñuñoa",
    address: "Av. Irarrázaval 3400, Ñuñoa",
    lat: -33.4569,
    lng: -70.5978,
    phone: "+56955556666",
    email: "info@calorcentral.cl",
    description: "Calefacción central y radiadores, con mantención anual programada.",
    modalities: ["Visita a domicilio", "Presupuesto sin costo"],
    services: [
      { name: "Calefacción central", priceFrom: 145000 },
      { name: "Montaje y mantenimiento", priceFrom: 70000 },
    ],
  }),
  build({
    id: "p-valpo-clima",
    legalName: "Valpo Clima Servicios",
    segment: "residencial",
    verificationStatus: "verificado",
    ratingAvg: 4.6,
    reviewsCount: 73,
    commune: "Viña del Mar",
    address: "Av. Libertad 800, Viña del Mar",
    lat: -33.0245,
    lng: -71.5518,
    phone: "+56966667777",
    email: "contacto@valpoclima.cl",
    description: "Instalación y reparación de aire acondicionado en la región de Valparaíso.",
    modalities: ["Visita a domicilio", "Atención de emergencia 24/7", "Boleta electrónica"],
    services: [
      { name: "Aire acondicionado residencial", priceFrom: 99000 },
      { name: "Reparación y carga de gas", priceFrom: 40000 },
    ],
  }),
  build({
    id: "p-limpio-lab",
    legalName: "Laboratorio Limpio Chile",
    segment: "industrial",
    verificationStatus: "verificado",
    ratingAvg: 4.8,
    reviewsCount: 34,
    commune: "Pudahuel",
    address: "Av. Amunátegui 178, Pudahuel",
    lat: -33.4405,
    lng: -70.7462,
    phone: "+56977778888",
    email: "proyectos@limpioclaboratorio.cl",
    description: "Salas limpias ISO, presión diferencial y validación de laboratorios.",
    modalities: ["Presupuesto sin costo", "Garantía escrita"],
    services: [
      { name: "Salas limpias y laboratorios", priceFrom: 380000 },
      { name: "Inspección técnica HVAC", priceFrom: 120000 },
    ],
  }),
  build({
    id: "p-sur-termico",
    legalName: "Sur Térmico Mantención",
    segment: "comercial",
    verificationStatus: "verificado",
    ratingAvg: 4.3,
    reviewsCount: 42,
    commune: "Puerto Montt",
    address: "Av. Diego Portales 600, Puerto Montt",
    lat: -41.4693,
    lng: -72.9424,
    phone: "+56988889999",
    email: "contacto@surtermico.cl",
    description: "Mantención y reparación de climatización comercial en el sur de Chile.",
    modalities: ["Visita a domicilio", "Boleta electrónica"],
    services: [
      { name: "Montaje y mantenimiento", priceFrom: 90000 },
      { name: "Aire acondicionado comercial", priceFrom: 125000 },
    ],
  }),
];

export const demoReviews: Record<string, Review[]> = {
  "p-clima-andes": [
    {
      id: "r1",
      providerId: "p-clima-andes",
      rating: 5,
      comment: "Instalaron la ventilación de nuestra bodega en tiempo récord. Muy profesionales.",
      authorName: "Rodrigo M.",
      createdAt: "2026-08-14T15:00:00.000Z",
      verified: true,
    },
    {
      id: "r2",
      providerId: "p-clima-andes",
      rating: 4,
      comment: "Buen trabajo, llegaron un poco tarde pero resolvieron todo.",
      authorName: "Carolina P.",
      createdAt: "2026-07-02T11:30:00.000Z",
      verified: true,
    },
  ],
  "p-hogar-fresco": [
    {
      id: "r3",
      providerId: "p-hogar-fresco",
      rating: 5,
      comment: "Instalación impecable del split, dejaron todo limpio. Recomendados.",
      authorName: "Daniela S.",
      createdAt: "2026-08-30T09:10:00.000Z",
      verified: true,
    },
  ],
  "p-frio-sur": [
    {
      id: "r4",
      providerId: "p-frio-sur",
      rating: 5,
      comment: "Mantuvieron el aire de nuestras oficinas sin detener la operación.",
      authorName: "Felipe R.",
      createdAt: "2026-06-21T18:45:00.000Z",
      verified: true,
    },
    {
      id: "r5",
      providerId: "p-frio-sur",
      rating: 4,
      comment: "Buena atención y presupuesto claro desde el inicio.",
      authorName: "María José L.",
      createdAt: "2026-05-09T13:20:00.000Z",
      verified: false,
    },
  ],
  "p-valpo-clima": [
    {
      id: "r6",
      providerId: "p-valpo-clima",
      rating: 5,
      comment: "Llegaron el mismo día por una emergencia en Viña. Excelente servicio.",
      authorName: "Andrés V.",
      createdAt: "2026-09-01T20:05:00.000Z",
      verified: true,
    },
  ],
};

const reviewStore: Record<string, Review[]> = {};
for (const [providerId, reviews] of Object.entries(demoReviews)) {
  reviewStore[providerId] = [...reviews];
}

export function getDemoProvider(id: string): ProviderDetail | undefined {
  return demoProviders.find((provider) => provider.id === id || provider.slug === id);
}

export function getDemoReviews(providerId: string): Review[] {
  return reviewStore[providerId] ?? [];
}

export function addDemoReview(review: Review): Review {
  const reviews = reviewStore[review.providerId] ?? [];
  reviewStore[review.providerId] = [review, ...reviews];
  const provider = getDemoProvider(review.providerId);
  if (provider) provider.reviewsCount += 1;
  return review;
}

export function toProviderSummary(provider: ProviderDetail, origin?: GeoPoint): ProviderSummary {
  const distance =
    origin && provider.location
      ? distanceMeters(origin, provider.location)
      : provider.distanceMeters;
  return {
    id: provider.id,
    legalName: provider.legalName,
    slug: provider.slug,
    segment: provider.segment,
    verificationStatus: provider.verificationStatus,
    ratingAvg: provider.ratingAvg,
    reviewsCount: provider.reviewsCount,
    city: provider.city,
    commune: provider.commune,
    distanceMeters: distance,
    location: provider.location,
    services: provider.services,
    priceFrom: provider.priceFrom,
    isDemo: provider.isDemo,
  };
}

function matchesQuery(provider: ProviderDetail, needle: string | undefined): boolean {
  if (!needle) return true;
  const haystack = [provider.legalName, provider.description ?? "", ...provider.services];
  return haystack.some((value) => value.toLowerCase().includes(needle));
}

export function searchDemoProviders(input: NearbySearchInput): ProviderSummary[] {
  const origin = { lat: input.lat, lng: input.lng };
  const radius = input.radiusKm * 1000;
  const needle = input.query?.toLowerCase();
  return demoProviders
    .filter((provider) => !input.segment || provider.segment === input.segment)
    .filter(
      (provider) =>
        !input.serviceId ||
        provider.servicesDetailed.some((service) => service.id === input.serviceId),
    )
    .filter((provider) => matchesQuery(provider, needle))
    .map((provider) => toProviderSummary(provider, origin))
    .filter((provider) => (provider.distanceMeters ?? Infinity) <= radius)
    .sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0))
    .slice(input.offset, input.offset + input.limit);
}

export interface DemoListOptions {
  segment?: ServiceSegment;
  query?: string;
  limit: number;
  offset: number;
}

export function listDemoProviders(options: DemoListOptions): {
  items: ProviderSummary[];
  total: number;
} {
  const needle = options.query?.toLowerCase();
  const filtered = demoProviders
    .filter((provider) => !options.segment || provider.segment === options.segment)
    .filter((provider) => matchesQuery(provider, needle))
    .sort((a, b) => (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0));
  const items = filtered
    .slice(options.offset, options.offset + options.limit)
    .map((provider) => toProviderSummary(provider));
  return { items, total: filtered.length };
}
