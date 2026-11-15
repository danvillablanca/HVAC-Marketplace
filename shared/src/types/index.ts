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
  /** PRO-06: disponible para nuevas solicitudes. */
  isAvailable?: boolean;
  /** PRO-03: radio de cobertura del proveedor. */
  coverageRadiusKm?: number | null;
}

/** BUS-03: pagina de resultados de la busqueda. */
export interface ProviderSearchResult {
  items: ProviderSummary[];
  total: number;
  limit: number;
  offset: number;
}

export interface ProviderDetail extends ProviderSummary {
  rut: string;
  email: string | null;
  phone: string | null;
  description: string | null;
  address: string | null;
  location: GeoPoint | null;
  modalities: string[];
  /** RN-10: telefono y correo ocultos hasta que exista una cotizacion aceptada. */
  contactHidden?: boolean;
  servicesDetailed: Array<{
    id: string;
    name: string;
    priceFrom: number | null;
    unit: string | null;
  }>;
}

/** Perfil del proveedor tal como lo ve y edita su duenio. */
export interface ProviderProfile {
  id: string;
  slug: string;
  legalName: string;
  rut: string;
  segment: ServiceSegment;
  description: string;
  phone: string;
  email: string;
  yearsExperience: number | null;
  website: string;
  commune: string;
  region: string;
  address: string;
  coverageRadiusKm: number;
  isAvailable: boolean;
  weeklyHours: Partial<
    Record<
      "lun" | "mar" | "mie" | "jue" | "vie" | "sab" | "dom",
      { open: string; close: string } | null
    >
  >;
  modalities: string[];
  services: Array<{ serviceId: string; name: string; priceFrom: number | null }>;
  verificationStatus: ProviderVerificationStatus;
  /** Motivo del ultimo rechazo, si aplica. */
  verificationNote: string | null;
}

export interface ServiceCatalogItem {
  id: string;
  name: string;
  segment: ServiceSegment;
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

// ---- Solicitudes de servicio ----

export const REQUEST_STATUS = [
  "abierta",
  "con_cotizaciones",
  "aceptada",
  "en_ejecucion",
  "completada",
  "cancelada",
] as const;
export type RequestStatus = (typeof REQUEST_STATUS)[number];

/** SOL-05 (cambio de alcance): motivo obligatorio al cancelar una solicitud. */
export const CANCEL_REASONS = [
  "presupuesto_alto",
  "proveedor_otra_via",
  "resuelto_solo",
  "otro",
] as const;
export type CancelReason = (typeof CANCEL_REASONS)[number];

export const QUOTE_STATUS = ["enviada", "aceptada", "rechazada", "vencida"] as const;
export type QuoteStatus = (typeof QUOTE_STATUS)[number];

export const EQUIPMENT_TYPES = ["split", "ducto", "chiller", "vrf", "camara_frio", "otro"] as const;
export type EquipmentType = (typeof EQUIPMENT_TYPES)[number];

export const URGENCY_LEVELS = ["baja", "media", "alta", "urgente"] as const;
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

export interface ServiceRequest {
  id: string;
  clientId: string;
  serviceId: string | null;
  serviceName: string | null;
  equipment: EquipmentType;
  description: string;
  urgency: UrgencyLevel;
  status: RequestStatus;
  commune: string | null;
  region: string | null;
  address: string | null;
  photos: string[];
  quotesCount: number;
  createdAt: string;
  updatedAt: string;
  /** Vista del proveedor (SOL-02): distancia aproximada a la solicitud. */
  distanceKm?: number | null;
  /** Vista del proveedor: estado de su propia cotizacion, si envio una. */
  myQuoteStatus?: QuoteStatus | null;
  /** COT-03: fecha en que el proveedor marco el trabajo como completado. */
  completedAt?: string | null;
  /** COT-03: confirmacion del cliente (o automatica a los 7 dias). */
  clientConfirmedAt?: string | null;
  /** Solicitud directa: empresa elegida por el cliente desde su perfil. */
  targetProviderId?: string | null;
  targetProviderName?: string | null;
  /** Vista del proveedor: la solicitud fue dirigida a su empresa. */
  isDirect?: boolean;
  /** SOL-05: motivo de cancelacion (obligatorio cuando status = cancelada). */
  cancelReason?: CancelReason | null;
  cancelReasonDetail?: string | null;
  cancelledAt?: string | null;
}

export interface Quote {
  id: string;
  requestId: string;
  providerId: string;
  providerName: string | null;
  amount: number;
  includesIva: boolean;
  scope: string;
  deadlineDays: number;
  validDays: number;
  status: QuoteStatus;
  createdAt: string;
  /** Métricas: momento en que el cliente aceptó la cotización. */
  acceptedAt?: string | null;
  /** COT-02: datos para comparar cotizaciones. */
  providerRating?: number | null;
  providerReviews?: number;
  providerSlug?: string | null;
  distanceKm?: number | null;
}

export interface ServiceRequestDetail extends ServiceRequest {
  quotes: Quote[];
  events: RequestEvent[];
}

export interface RequestEvent {
  id: string;
  requestId: string;
  actorId: string | null;
  fromStatus: RequestStatus | null;
  toStatus: RequestStatus;
  note: string | null;
  createdAt: string;
}

// ---- Mensajeria (MSG-01) ----

export interface ChatMessage {
  id: string;
  requestId: string;
  providerId: string;
  senderId: string;
  /** El mensaje lo escribio el usuario que consulta. */
  mine: boolean;
  body: string;
  readAt: string | null;
  createdAt: string;
}

/** Resumen de un hilo (cliente con cada proveedor que cotizo). */
export interface ChatThread {
  requestId: string;
  providerId: string;
  providerName: string | null;
  unread: number;
  lastMessage: string | null;
  lastAt: string | null;
}

// ---- Notificaciones ----

export const NOTIFICATION_TYPES = [
  "nueva_solicitud",
  "nueva_cotizacion",
  "cotizacion_aceptada",
  "cotizacion_rechazada",
  "solicitud_actualizada",
  "verificacion_aprobada",
  "verificacion_rechazada",
  "nuevo_mensaje",
  "sistema",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string | null;
  refType: string | null;
  refId: string | null;
  read: boolean;
  createdAt: string;
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
