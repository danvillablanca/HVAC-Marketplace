/** Catalogo base de servicios HVAC (coherente con el caso de negocio). */
export interface ServiceCategoryDef {
  slug: string;
  name: string;
  segment: "residencial" | "comercial" | "industrial";
}

export const SERVICE_CATEGORIES: ServiceCategoryDef[] = [
  {
    slug: "aire-acondicionado-residencial",
    name: "Aire acondicionado residencial",
    segment: "residencial",
  },
  {
    slug: "instalacion-split",
    name: "Venta e instalacion de equipos Split",
    segment: "residencial",
  },
  { slug: "calefaccion-central", name: "Calefaccion central", segment: "residencial" },
  { slug: "piscinas-temperadas", name: "Piscinas temperadas", segment: "residencial" },
  { slug: "energia-solar", name: "Energia solar", segment: "residencial" },
  {
    slug: "ventilacion-industrial",
    name: "Ventilacion industrial y comercial",
    segment: "industrial",
  },
  {
    slug: "aire-acondicionado-comercial",
    name: "Aire acondicionado comercial",
    segment: "comercial",
  },
  { slug: "centrales-termicas", name: "Centrales termicas", segment: "industrial" },
  { slug: "salas-limpias", name: "Salas limpias y laboratorios", segment: "industrial" },
  { slug: "montaje-mantenimiento", name: "Montaje y mantenimiento", segment: "industrial" },
  { slug: "inspeccion", name: "Inspeccion tecnica HVAC", segment: "comercial" },
  { slug: "reparacion", name: "Reparacion y carga de gas", segment: "residencial" },
];

export const MODALITIES = [
  "Visita a domicilio",
  "Atencion de emergencia 24/7",
  "Boleta electronica",
  "Garantia escrita",
  "Presupuesto sin costo",
];

/** Regiones de Chile (subconjunto usado para el seed/MVP). */
export const CHILE_REGIONS = [
  "Arica y Parinacota",
  "Tarapaca",
  "Antofagasta",
  "Atacama",
  "Coquimbo",
  "Valparaiso",
  "Metropolitana de Santiago",
  "O'Higgins",
  "Maule",
  "Nuble",
  "Biobio",
  "La Araucania",
  "Los Rios",
  "Los Lagos",
  "Aysen",
  "Magallanes",
] as const;

/** Centro por defecto del mapa (Santiago, Chile). */
export const DEFAULT_MAP_CENTER = { lat: -33.4489, lng: -70.6693 };
