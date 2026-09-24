/**
 * Roles de usuario de la plataforma.
 * - cliente: usuario final que busca y contrata proveedores HVAC.
 * - proveedor: empresa/persona que ofrece servicios HVAC.
 * - admin: ASHRAE / administracion que verifica proveedores.
 */
export const USER_ROLES = ["cliente", "proveedor", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const PROVIDER_VERIFICATION_STATUS = [
  "pendiente",
  "en_revision",
  "verificado",
  "rechazado",
] as const;
export type ProviderVerificationStatus = (typeof PROVIDER_VERIFICATION_STATUS)[number];

export const LEAD_STATUS = ["nuevo", "contactado", "cotizado", "cerrado", "perdido"] as const;
export type LeadStatus = (typeof LEAD_STATUS)[number];

export const APPOINTMENT_STATUS = ["propuesta", "confirmada", "realizada", "cancelada"] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUS)[number];

/** Sector al que apunta un proveedor o servicio. */
export const SERVICE_SEGMENTS = ["residencial", "comercial", "industrial"] as const;
export type ServiceSegment = (typeof SERVICE_SEGMENTS)[number];

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface ProviderSummary {
  id: string;
  legalName: string;
  slug: string;
  segment: ServiceSegment;
  verificationStatus: ProviderVerificationStatus;
  ratingAvg: number | null;
  reviewsCount: number;
  city: string | null;
  commune: string | null;
  distanceMeters: number | null;
  location?: GeoPoint | null;
  services: string[];
  priceFrom: number | null;
  isDemo: boolean;
}

export interface ProviderDetail extends ProviderSummary {
  rut: string;
  email: string | null;
  phone: string | null;
  description: string | null;
  address: string | null;
  location: GeoPoint | null;
  modalities: string[];
  servicesDetailed: Array<{
    id: string;
    name: string;
    priceFrom: number | null;
    unit: string | null;
  }>;
}

export interface Review {
  id: string;
  providerId: string;
  rating: number;
  comment: string | null;
  authorName: string;
  createdAt: string;
  verified: boolean;
}

export interface Lead {
  id: string;
  clientId: string;
  providerId: string;
  serviceId: string | null;
  description: string;
  status: LeadStatus;
  createdAt: string;
}

export interface Appointment {
  id: string;
  leadId: string;
  startsAt: string;
  status: AppointmentStatus;
}

/** Respuesta estandar de la API. */
export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
