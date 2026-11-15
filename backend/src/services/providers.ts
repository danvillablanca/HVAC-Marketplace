import type {
  NearbySearchInput,
  ProviderSearchResult,
  ProviderDetail,
  ProviderSummary,
  Review,
  ServiceSegment,
} from "@hvac/shared";
import { getServiceClient } from "../lib/supabase";
import { HttpError } from "../lib/http";
import {
  getDemoProvider,
  getDemoReviews,
  listDemoProviders,
  searchDemoProviders,
} from "../data/demo";
import { mapProviderRow, mapProviderSummaryRow, mapReviewRow } from "./mappers";
import type { AuthenticatedUser } from "../lib/auth";
import { findDemoProfileByProviderId } from "./provider-profile";
import { demoHasAcceptedQuote } from "./requests";

export interface ListProvidersInput {
  segment?: ServiceSegment;
  query?: string;
  limit: number;
  offset: number;
}

export interface ListProvidersResult {
  items: ProviderSummary[];
  total: number;
  limit: number;
  offset: number;
}

export async function searchNearby(input: NearbySearchInput): Promise<ProviderSearchResult> {
  const supabase = getServiceClient();
  if (!supabase) return { ...searchDemoProviders(input), limit: input.limit, offset: input.offset };

  const { data, error } = await supabase.rpc("nearby_providers", {
    p_lat: input.lat,
    p_lng: input.lng,
    p_radius_km: input.radiusKm,
    p_segment: input.segment ?? null,
    p_service_id: input.serviceId ?? null,
    p_query: input.query ?? null,
    p_limit: input.limit,
    p_offset: input.offset,
    p_min_rating: input.minRating ?? null,
    p_only_available: input.onlyAvailable,
    p_sort: input.sort,
  });
  if (error) {
    throw new HttpError("db_error", "No se pudo buscar proveedores", 502, error.message);
  }
  const rows = (data ?? []) as Array<Record<string, any>>;
  return {
    items: rows.map((row) => mapProviderSummaryRow(row)),
    total: rows.length > 0 ? Number(rows[0].total_count) : 0,
    limit: input.limit,
    offset: input.offset,
  };
}

export async function listProviders(input: ListProvidersInput): Promise<ListProvidersResult> {
  const supabase = getServiceClient();
  if (!supabase) {
    const { items, total } = listDemoProviders(input);
    return { items, total, limit: input.limit, offset: input.offset };
  }

  let query = supabase
    .from("providers")
    .select("*", { count: "exact" })
    .order("rating_avg", { ascending: false })
    .range(input.offset, input.offset + input.limit - 1);
  if (input.segment) query = query.eq("segment", input.segment);
  if (input.query) query = query.ilike("legal_name", `%${input.query}%`);

  const { data, error, count } = await query;
  if (error) {
    throw new HttpError("db_error", "No se pudo listar proveedores", 502, error.message);
  }
  const rows = (data ?? []) as Array<Record<string, any>>;
  return {
    items: rows.map((row) => mapProviderSummaryRow(row)),
    total: count ?? rows.length,
    limit: input.limit,
    offset: input.offset,
  };
}

const DETAIL_SELECT =
  "*, provider_services(service_id, price_from, unit, services(name)), locations(commune, address, lat, lng, is_primary)";

export async function getProvider(id: string): Promise<ProviderDetail | null> {
  const supabase = getServiceClient();
  if (!supabase) return getDemoProvider(id) ?? null;

  const bySlug = await supabase
    .from("providers")
    .select(DETAIL_SELECT)
    .eq("slug", id)
    .maybeSingle();
  if (bySlug.error) {
    throw new HttpError("db_error", "No se pudo obtener el proveedor", 502, bySlug.error.message);
  }
  let row = bySlug.data;
  if (!row) {
    const byId = await supabase.from("providers").select(DETAIL_SELECT).eq("id", id).maybeSingle();
    if (byId.error) {
      throw new HttpError("db_error", "No se pudo obtener el proveedor", 502, byId.error.message);
    }
    row = byId.data;
  }
  if (!row) return null;
  const location =
    (row.locations ?? []).find((l: Record<string, any>) => l.is_primary) ?? row.locations?.[0];
  return mapProviderRow({
    ...row,
    commune: location?.commune ?? null,
    address: location?.address ?? null,
    lat: location?.lat ?? null,
    lng: location?.lng ?? null,
  });
}

export async function listReviews(providerId: string): Promise<Review[]> {
  const supabase = getServiceClient();
  if (!supabase) return getDemoReviews(providerId);

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });
  if (error) {
    throw new HttpError("db_error", "No se pudieron obtener las reseñas", 502, error.message);
  }
  const rows = (data ?? []) as Array<Record<string, any>>;
  return rows.map((row) => mapReviewRow(row));
}

/**
 * RN-10 / REQ-PRO-05: el contacto se muestra al admin, al propio proveedor y al
 * cliente que acepto una cotizacion de ese proveedor.
 */
export async function canSeeContact(
  providerId: string,
  viewer: AuthenticatedUser | null,
): Promise<boolean> {
  if (!viewer) return false;
  if (viewer.role === "admin") return true;

  const supabase = getServiceClient();
  if (!supabase) {
    const owner = findDemoProfileByProviderId(providerId);
    if (viewer.role === "proveedor") return owner?.userId === viewer.id;
    return demoHasAcceptedQuote(viewer.id, providerId);
  }

  if (viewer.role === "proveedor") {
    const { data } = await supabase
      .from("providers")
      .select("id")
      .eq("id", providerId)
      .eq("user_id", viewer.id)
      .maybeSingle();
    return Boolean(data);
  }
  const { data } = await supabase
    .from("quotes")
    .select("id, service_requests!inner(client_id)")
    .eq("provider_id", providerId)
    .eq("status", "aceptada")
    .eq("service_requests.client_id", viewer.id)
    .limit(1);
  return (data ?? []).length > 0;
}

/** Detalle publico del proveedor con el contacto oculto segun RN-10. */
export async function getProviderForViewer(
  id: string,
  viewer: AuthenticatedUser | null,
): Promise<ProviderDetail | null> {
  const provider = await getProvider(id);
  if (!provider) return null;
  if (await canSeeContact(provider.id, viewer)) return { ...provider, contactHidden: false };
  return { ...provider, phone: null, email: null, contactHidden: true };
}
