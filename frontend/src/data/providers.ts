import type { ProviderDetail, Review, ServiceSegment } from "@hvac/shared";

/**
 * Datos demo/semilla del frontend (fallback cuando el backend no esta disponible).
 * Reflejan el seed de Supabase y se marcan con isDemo = true.
 */

interface DemoProviderInput {
  id: string;
  legalName: string;
  segment: ServiceSegment;
  verificationStatus: ProviderDetail["verificationStatus"];
  ratingAvg: number;
  reviewsCount: number;
  commune: string;
  region: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  email: string;
  description: string;
  modalities: string[];
  services: Array<{ name: string; priceFrom: number }>;
}

function build(input: DemoProviderInput): ProviderDetail {
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
    services: input.services.map((s) => s.name),
    priceFrom: Math.min(...input.services.map((s) => s.priceFrom)),
    isDemo: true,
    rut: "76.543.210-K",
    email: input.email,
    phone: input.phone,
    description: input.description,
    address: input.address,
    location: { lat: input.lat, lng: input.lng },
    modalities: input.modalities,
    servicesDetailed: input.services.map((s, index) => ({
      id: `${input.id}-svc-${index}`,
      name: s.name,
      priceFrom: s.priceFrom,
      unit: "visita",
    })),
  };
}

export const DEMO_PROVIDERS: ProviderDetail[] = [
  build({
    id: "p-clima-andes",
    legalName: "Clima Andes SpA",
    segment: "industrial",
    verificationStatus: "verificado",
    ratingAvg: 4.8,
    reviewsCount: 132,
    commune: "Quinta Normal",
    region: "Metropolitana de Santiago",
    address: "Lope de Ulloa 1760, Quinta Normal",
    lat: -33.4325,
    lng: -70.7005,
    phone: "+56973337025",
    email: "contacto@climaandes.cl",
    description:
      "Ingenieria HVAC industrial: ventilacion, centrales termicas, salas limpias y montaje. Mas de 10 anos y certificacion ASHRAE.",
    modalities: ["Visita a domicilio", "Atencion de emergencia 24/7", "Garantia escrita"],
    services: [
      { name: "Ventilacion industrial y comercial", priceFrom: 180000 },
      { name: "Centrales termicas", priceFrom: 450000 },
      { name: "Montaje y mantenimiento", priceFrom: 95000 },
    ],
  }),
  build({
    id: "p-frio-sur",
    legalName: "Frio Sur Climatizacion Ltda.",
    segment: "comercial",
    verificationStatus: "verificado",
    ratingAvg: 4.6,
    reviewsCount: 88,
    commune: "Providencia",
    region: "Metropolitana de Santiago",
    address: "Av. Providencia 1234, Providencia",
    lat: -33.426,
    lng: -70.614,
    phone: "+56987654321",
    email: "ventas@friosur.cl",
    description: "Aire acondicionado comercial y mantenimiento preventivo para oficinas y retail.",
    modalities: ["Visita a domicilio", "Presupuesto sin costo", "Boleta electronica"],
    services: [
      { name: "Aire acondicionado comercial", priceFrom: 120000 },
      { name: "Inspeccion tecnica HVAC", priceFrom: 60000 },
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
    region: "Metropolitana de Santiago",
    address: "Av. Vicuna Mackenna 5678, La Florida",
    lat: -33.5225,
    lng: -70.5983,
    phone: "+56911112222",
    email: "hola@hogarfresco.cl",
    description: "Especialistas en Split inverter: venta, instalacion y carga de gas R32/R410.",
    modalities: ["Visita a domicilio", "Garantia escrita", "Presupuesto sin costo"],
    services: [
      { name: "Venta e instalacion de equipos Split", priceFrom: 89990 },
      { name: "Reparacion y carga de gas", priceFrom: 45000 },
      { name: "Aire acondicionado residencial", priceFrom: 110000 },
    ],
  }),
  build({
    id: "p-solar-verde",
    legalName: "Solar Verde Energia",
    segment: "residencial",
    verificationStatus: "verificado",
    ratingAvg: 4.7,
    reviewsCount: 64,
    commune: "Maipu",
    region: "Metropolitana de Santiago",
    address: "Av. Pajaritos 2100, Maipu",
    lat: -33.5108,
    lng: -70.7575,
    phone: "+56933334444",
    email: "contacto@solarverde.cl",
    description: "Paneles solares y piscinas temperadas con enfoque de eficiencia energetica.",
    modalities: ["Visita a domicilio", "Boleta electronica", "Garantia escrita"],
    services: [
      { name: "Energia solar", priceFrom: 950000 },
      { name: "Piscinas temperadas", priceFrom: 780000 },
    ],
  }),
  build({
    id: "p-termica-norte",
    legalName: "Termica Norte Ingenieria",
    segment: "industrial",
    verificationStatus: "en_revision",
    ratingAvg: 4.4,
    reviewsCount: 27,
    commune: "Antofagasta",
    region: "Antofagasta",
    address: "Av. Argentina 1500, Antofagasta",
    lat: -23.6509,
    lng: -70.3975,
    phone: "+56922223333",
    email: "proyectos@termicanorte.cl",
    description:
      "HVAC industrial para mineria: ventilacion forzada y refrigeracion de salas electricas.",
    modalities: ["Visita a domicilio", "Atencion de emergencia 24/7"],
    services: [
      { name: "Ventilacion industrial y comercial", priceFrom: 250000 },
      { name: "Centrales termicas", priceFrom: 520000 },
    ],
  }),
  build({
    id: "p-aire-bio",
    legalName: "Aire Bio Clima",
    segment: "comercial",
    verificationStatus: "verificado",
    ratingAvg: 4.5,
    reviewsCount: 51,
    commune: "Concepcion",
    region: "Biobio",
    address: "O'Higgins 940, Concepcion",
    lat: -36.8269,
    lng: -73.0498,
    phone: "+56944445555",
    email: "contacto@airebio.cl",
    description: "Climatizacion comercial, salas limpias y laboratorios en la region del Biobio.",
    modalities: ["Presupuesto sin costo", "Garantia escrita"],
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
    commune: "Nunoa",
    region: "Metropolitana de Santiago",
    address: "Av. Irarrazaval 3400, Nunoa",
    lat: -33.4569,
    lng: -70.5978,
    phone: "+56955556666",
    email: "info@calorcentral.cl",
    description: "Calefaccion central y radiadores, con mantencion anual programada.",
    modalities: ["Visita a domicilio", "Presupuesto sin costo"],
    services: [
      { name: "Calefaccion central", priceFrom: 145000 },
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
    commune: "Vina del Mar",
    region: "Valparaiso",
    address: "Av. Libertad 800, Vina del Mar",
    lat: -33.0245,
    lng: -71.5518,
    phone: "+56966667777",
    email: "contacto@valpoclima.cl",
    description: "Instalacion y reparacion de aire acondicionado en la region de Valparaiso.",
    modalities: ["Visita a domicilio", "Atencion de emergencia 24/7", "Boleta electronica"],
    services: [
      { name: "Aire acondicionado residencial", priceFrom: 99000 },
      { name: "Reparacion y carga de gas", priceFrom: 40000 },
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
    region: "Metropolitana de Santiago",
    address: "Av. Amunategui 178, Pudahuel",
    lat: -33.4405,
    lng: -70.7462,
    phone: "+56977778888",
    email: "proyectos@limpioclaboratorio.cl",
    description: "Salas limpias ISO, presion diferencial y validacion de laboratorios.",
    modalities: ["Presupuesto sin costo", "Garantia escrita"],
    services: [
      { name: "Salas limpias y laboratorios", priceFrom: 380000 },
      { name: "Inspeccion tecnica HVAC", priceFrom: 120000 },
    ],
  }),
  build({
    id: "p-sur-termico",
    legalName: "Sur Termico Mantencion",
    segment: "comercial",
    verificationStatus: "verificado",
    ratingAvg: 4.3,
    reviewsCount: 42,
    commune: "Puerto Montt",
    region: "Los Lagos",
    address: "Av. Diego Portales 600, Puerto Montt",
    lat: -41.4693,
    lng: -72.9424,
    phone: "+56988889999",
    email: "contacto@surtermico.cl",
    description: "Mantencion y reparacion de climatizacion comercial en el sur de Chile.",
    modalities: ["Visita a domicilio", "Boleta electronica"],
    services: [
      { name: "Montaje y mantenimiento", priceFrom: 90000 },
      { name: "Aire acondicionado comercial", priceFrom: 125000 },
    ],
  }),
];

export const DEMO_REVIEWS: Record<string, Review[]> = {
  "p-clima-andes": [
    {
      id: "r1",
      providerId: "p-clima-andes",
      rating: 5,
      comment: "Instalaron la ventilacion de nuestra bodega en tiempo record. Muy profesionales.",
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
      comment: "Instalacion impecable del split, dejaron todo limpio. Recomendados.",
      authorName: "Daniela S.",
      createdAt: "2026-08-30T09:10:00.000Z",
      verified: true,
    },
  ],
};

export function findDemoProvider(id: string): ProviderDetail | undefined {
  return DEMO_PROVIDERS.find((p) => p.id === id || p.slug === id);
}
