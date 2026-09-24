import type {
  NearbySearchInput,
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

export async function searchNearby(input: NearbySearchInput): Promise<ProviderSummary[]> {
  const supabase = getServiceClient();
  if (!supabase) return searchDemoProviders(input);

  const { data, error } = await supabase.rpc("nearby_providers", {
    p_lat: input.lat,
    p_lng: input.lng,
    p_radius_km: input.radiusKm,
    p_segment: input.segment ?? null,
    p_service_id: input.serviceId ?? null,
    p_query: input.query ?? null,
    p_limit: input.limit,
    p_offset: input.offset,
  });
  if (error) {
    throw new HttpError("db_error", "No se pudo buscar proveedores", 502, error.message);
  }
  const rows = (data ?? []) as Array<Record<string, any>>;
  return rows.map((row) => mapProviderSummaryRow(row));
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

export async function getProvider(id: string): Promise<ProviderDetail | null> {
  const supabase = getServiceClient();
  if (!supabase) return getDemoProvider(id) ?? null;

  const bySlug = await supabase
    .from("providers")
    .select("*, provider_services(*)")
    .eq("slug", id)
    .maybeSingle();
  if (bySlug.error) {
    throw new HttpError("db_error", "No se pudo obtener el proveedor", 502, bySlug.error.message);
  }
  let row = bySlug.data;
  if (!row) {
    const byId = await supabase
      .from("providers")
      .select("*, provider_services(*)")
      .eq("id", id)
      .maybeSingle();
    if (byId.error) {
      throw new HttpError("db_error", "No se pudo obtener el proveedor", 502, byId.error.message);
    }
    row = byId.data;
  }
  if (!row) return null;
  return mapProviderRow(row);
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
