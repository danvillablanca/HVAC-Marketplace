import { randomUUID } from "node:crypto";
import {
  COMMUNES,
  SERVICE_CATALOG,
  findCommune,
  type ProviderDetail,
  type ProviderProfile,
  type ProviderProfileInput,
  type ServiceCatalogItem,
  type VerificationRequestInput,
} from "@hvac/shared";
import { getServiceClient } from "../lib/supabase";
import { isDemoMode } from "../lib/env";
import { HttpError } from "../lib/http";
import { demoProviders } from "../data/demo";

type Row = Record<string, any>;

// ---- Demo: un perfil por usuario proveedor, reflejado en demoProviders ----
const demoProfiles = new Map<string, ProviderProfile>();

function requireDemo(): void {
  if (!isDemoMode) throw new HttpError("service_unavailable", "Base de datos no disponible", 503);
}

function serviceName(id: string): string {
  return SERVICE_CATALOG.find((s) => s.id === id)?.name ?? "Servicio";
}

function slugify(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base || "proveedor"}-${randomUUID().slice(0, 6)}`;
}

/** Refleja el perfil demo en la lista que usan la busqueda y la cola del admin. */
function syncDemoProvider(profile: ProviderProfile): void {
  const commune = findCommune(profile.commune);
  const existing = demoProviders.find((p) => p.id === profile.id);
  const detail: ProviderDetail = {
    id: profile.id,
    legalName: profile.legalName,
    slug: profile.slug,
    segment: profile.segment,
    verificationStatus: profile.verificationStatus,
    ratingAvg: existing?.ratingAvg ?? null,
    reviewsCount: existing?.reviewsCount ?? 0,
    city: profile.commune,
    commune: profile.commune,
    distanceMeters: null,
    services: profile.services.map((s) => s.name),
    priceFrom: Math.min(...profile.services.map((s) => s.priceFrom ?? Infinity)) || null,
    isDemo: true,
    isAvailable: profile.isAvailable,
    coverageRadiusKm: profile.coverageRadiusKm,
    rut: profile.rut,
    email: profile.email,
    phone: profile.phone,
    description: profile.description,
    address: profile.address,
    location: commune ? { lat: commune.lat, lng: commune.lng } : null,
    modalities: profile.modalities,
    servicesDetailed: profile.services.map((s) => ({
      id: s.serviceId,
      name: s.name,
      priceFrom: s.priceFrom,
      unit: "visita",
    })),
  };
  if (!Number.isFinite(detail.priceFrom ?? 0)) detail.priceFrom = null;
  const index = demoProviders.findIndex((p) => p.id === profile.id);
  if (index >= 0) demoProviders[index] = detail;
  else demoProviders.push(detail);
}

/** Perfiles demo con su usuario (incluye el precargado de `proveedor@demo.cl`). */
export function listDemoProfiles(): Array<{ userId: string; profile: ProviderProfile }> {
  if (!demoProfiles.has("demo-proveedor")) seedDemoProfile("demo-proveedor");
  return [...demoProfiles.entries()].map(([userId, profile]) => ({ userId, profile }));
}

/** Busca el perfil demo de un proveedor por el id del proveedor (para la cola del admin). */
export function findDemoProfileByProviderId(
  providerId: string,
): { userId: string; profile: ProviderProfile } | null {
  return listDemoProfiles().find((entry) => entry.profile.id === providerId) ?? null;
}

/** Perfil precargado para `proveedor@demo.cl` en modo demo. */
function seedDemoProfile(userId: string): ProviderProfile | null {
  if (userId !== "demo-proveedor") return null;
  const profile: ProviderProfile = {
    // Reutiliza la ficha demo existente de Hogar Fresco para no duplicarla en la busqueda.
    id: "p-hogar-fresco",
    slug: "p-hogar-fresco",
    legalName: "Hogar Fresco Instalaciones",
    rut: "769876545",
    segment: "residencial",
    description: "Especialistas en Split inverter: venta, instalacion y carga de gas R32/R410.",
    phone: "+56911112222",
    email: "proveedor@demo.cl",
    yearsExperience: 8,
    website: "",
    commune: "La Florida",
    region: "Metropolitana de Santiago",
    address: "Av. Vicuna Mackenna 5678",
    coverageRadiusKm: 30,
    isAvailable: true,
    weeklyHours: {
      lun: { open: "09:00", close: "18:00" },
      mar: { open: "09:00", close: "18:00" },
      mie: { open: "09:00", close: "18:00" },
      jue: { open: "09:00", close: "18:00" },
      vie: { open: "09:00", close: "18:00" },
    },
    modalities: ["Visita a domicilio", "Garantia escrita"],
    services: [SERVICE_CATALOG[1], SERVICE_CATALOG[11]].map((s, i) => ({
      serviceId: s.id,
      name: s.name,
      priceFrom: i === 0 ? 89990 : 45000,
    })),
    verificationStatus: "verificado",
    verificationNote: null,
  };
  demoProfiles.set(userId, profile);
  syncDemoProvider(profile);
  return profile;
}

// ---- Supabase ----

function mapProfileRow(row: Row): ProviderProfile {
  const location =
    (Array.isArray(row.locations) ? row.locations : []).find((l: Row) => l.is_primary) ??
    (Array.isArray(row.locations) ? row.locations[0] : null);
  return {
    id: String(row.id),
    slug: String(row.slug ?? row.id),
    legalName: String(row.legal_name ?? ""),
    rut: String(row.rut ?? ""),
    segment: row.segment ?? "residencial",
    description: row.description ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    yearsExperience: row.years_experience ?? null,
    website: row.website ?? "",
    commune: location?.commune ?? "",
    region: location?.region ?? "",
    address: location?.address ?? "",
    coverageRadiusKm: Number(row.coverage_radius_km ?? 25),
    isAvailable: row.is_available ?? true,
    weeklyHours: row.weekly_hours ?? {},
    modalities: Array.isArray(row.modalities) ? row.modalities : [],
    services: (Array.isArray(row.provider_services) ? row.provider_services : []).map(
      (ps: Row) => ({
        serviceId: String(ps.service_id),
        name: String(ps.services?.name ?? serviceName(String(ps.service_id))),
        priceFrom: ps.price_from ?? null,
      }),
    ),
    verificationStatus: row.verification_status ?? "pendiente",
    verificationNote: row.verification_note ?? null,
  };
}

const PROFILE_SELECT =
  "*, provider_services(service_id, price_from, services(name)), locations(commune, region, address, is_primary)";

async function fetchProfile(db: any, userId: string): Promise<ProviderProfile | null> {
  const { data, error } = await db
    .from("providers")
    .select(PROFILE_SELECT)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new HttpError("db_error", "No se pudo obtener el perfil", 502, error.message);
  return data ? mapProfileRow(data) : null;
}

// ---- API del servicio ----

export async function getMyProfile(userId: string): Promise<ProviderProfile | null> {
  const db = getServiceClient();
  if (!db) {
    requireDemo();
    return demoProfiles.get(userId) ?? seedDemoProfile(userId);
  }
  return fetchProfile(db, userId);
}

export async function saveMyProfile(
  userId: string,
  input: ProviderProfileInput,
): Promise<ProviderProfile> {
  const db = getServiceClient();
  const commune = findCommune(input.commune);
  if (!commune) throw new HttpError("validation_error", "Comuna no reconocida", 422);

  if (!db) {
    requireDemo();
    const current = demoProfiles.get(userId) ?? seedDemoProfile(userId);
    const profile: ProviderProfile = {
      id: current?.id ?? `p-${randomUUID().slice(0, 8)}`,
      slug: current?.slug ?? slugify(input.legalName),
      ...input,
      commune: commune.name,
      region: commune.region,
      services: input.services.map((s) => ({
        serviceId: s.serviceId,
        name: serviceName(s.serviceId),
        priceFrom: s.priceFrom ?? null,
      })),
      verificationStatus: current?.verificationStatus ?? "pendiente",
      verificationNote: current?.verificationNote ?? null,
    };
    demoProfiles.set(userId, profile);
    syncDemoProvider(profile);
    return profile;
  }

  const fields = {
    legal_name: input.legalName,
    rut: input.rut,
    segment: input.segment,
    description: input.description,
    phone: input.phone,
    email: input.email,
    years_experience: input.yearsExperience,
    website: input.website || null,
    coverage_radius_km: input.coverageRadiusKm,
    is_available: input.isAvailable,
    weekly_hours: input.weeklyHours,
    modalities: input.modalities,
  };

  const existing = await fetchProfile(db, userId);
  let providerId = existing?.id;
  if (providerId) {
    const { error } = await db.from("providers").update(fields).eq("id", providerId);
    if (error) throw saveError(error);
  } else {
    const { data, error } = await db
      .from("providers")
      .insert({ ...fields, user_id: userId, slug: slugify(input.legalName) })
      .select("id")
      .single();
    if (error) throw saveError(error);
    providerId = String(data.id);
  }

  // Servicios (REQ-PRO-02): se reemplaza la seleccion completa.
  await db.from("provider_services").delete().eq("provider_id", providerId);
  const { error: servicesError } = await db.from("provider_services").insert(
    input.services.map((s) => ({
      provider_id: providerId,
      service_id: s.serviceId,
      price_from: s.priceFrom ?? null,
      unit: "visita",
    })),
  );
  if (servicesError) throw saveError(servicesError);

  // Ubicacion base (REQ-PRO-03): centroide de la comuna (mismo dato que public.communes).
  await db.from("locations").delete().eq("provider_id", providerId).eq("is_primary", true);
  const { error: locationError } = await db.from("locations").insert({
    provider_id: providerId,
    label: "Principal",
    address: input.address || null,
    region: commune.region,
    commune: commune.name,
    geom: `SRID=4326;POINT(${commune.lng} ${commune.lat})`,
    is_primary: true,
  });
  if (locationError) throw saveError(locationError);

  const saved = await fetchProfile(db, userId);
  if (!saved) throw new HttpError("db_error", "No se pudo guardar el perfil", 502);
  return saved;
}

function saveError(error: { code?: string; message: string }): HttpError {
  if (error.code === "23505") {
    return new HttpError("duplicate", "Ya existe un proveedor con ese RUT", 409);
  }
  return new HttpError("db_error", "No se pudo guardar el perfil", 502, error.message);
}

/** Envio simple a verificacion: deja el proveedor en revision con los documentos declarados. */
export async function requestVerification(
  userId: string,
  input: VerificationRequestInput,
): Promise<ProviderProfile> {
  const profile = await getMyProfile(userId);
  if (!profile) {
    throw new HttpError(
      "profile_required",
      "Completa tu perfil antes de solicitar la verificación",
      409,
    );
  }
  if (profile.verificationStatus === "verificado") {
    throw new HttpError("already_verified", "Tu empresa ya está verificada", 409);
  }

  const db = getServiceClient();
  if (!db) {
    const updated: ProviderProfile = {
      ...profile,
      verificationStatus: "en_revision",
      verificationNote: null,
    };
    demoProfiles.set(userId, updated);
    syncDemoProvider(updated);
    return updated;
  }

  const { error } = await db
    .from("providers")
    .update({ verification_status: "en_revision", verification_note: null })
    .eq("id", profile.id);
  if (error)
    throw new HttpError("db_error", "No se pudo enviar la verificación", 502, error.message);
  await db
    .from("verification_items")
    .insert(
      input.documents.map((item) => ({ provider_id: profile.id, item, status: "en_revision" })),
    );
  return { ...profile, verificationStatus: "en_revision", verificationNote: null };
}

/** Actualiza el reflejo demo tras una decision del admin. */
export function applyDemoDecision(
  providerId: string,
  status: ProviderProfile["verificationStatus"],
  note: string | null,
): string | null {
  const found = findDemoProfileByProviderId(providerId);
  if (!found) return null;
  const updated = { ...found.profile, verificationStatus: status, verificationNote: note };
  demoProfiles.set(found.userId, updated);
  syncDemoProvider(updated);
  return found.userId;
}

// ---- Catalogos publicos ----

export async function listServiceCatalog(): Promise<ServiceCatalogItem[]> {
  const db = getServiceClient();
  if (!db) return SERVICE_CATALOG;
  const { data, error } = await db
    .from("services")
    .select("id, name, categories(segment)")
    .order("name");
  if (error) throw new HttpError("db_error", "No se pudo obtener el catálogo", 502, error.message);
  return (data ?? []).map((row: Row) => ({
    id: String(row.id),
    name: String(row.name),
    segment: row.categories?.segment ?? "residencial",
  }));
}

export function listCommunes() {
  return COMMUNES;
}
