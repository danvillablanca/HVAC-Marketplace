import { useMutation, useQuery } from "@tanstack/react-query";
import { nearbySearchSchema } from "@hvac/shared";
import type {
  NearbySearchInput,
  NearbySearchParams,
  ProviderSearchResult,
  ProviderDetail,
  ProviderSummary,
  Review,
  ReviewCreateInput,
} from "@hvac/shared";
import { apiFetch } from "@/lib/api";
import { distanceMeters } from "@/lib/geo";
import { DEMO_PROVIDERS, DEMO_REVIEWS, findDemoProvider } from "@/data/providers";

function toSummary(
  provider: ProviderDetail,
  origin?: { lat: number; lng: number },
): ProviderSummary {
  const distance = origin && provider.location ? distanceMeters(origin, provider.location) : null;
  return { ...provider, distanceMeters: distance };
}

/** Fallback sin backend: mismos filtros que la API sobre los datos demo del frontend. */
function filterDemo(input: NearbySearchInput): ProviderSearchResult {
  const origin = { lat: input.lat, lng: input.lng };
  const needle = input.query?.toLowerCase();
  const all = DEMO_PROVIDERS.filter((p) => p.verificationStatus === "verificado")
    .map((p) => toSummary(p, origin))
    .filter((p) => {
      const withinRadius = p.distanceMeters !== null && p.distanceMeters <= input.radiusKm * 1000;
      const segmentOk = !input.segment || p.segment === input.segment;
      const ratingOk = input.minRating == null || (p.ratingAvg ?? 0) >= input.minRating;
      const queryOk =
        !needle ||
        p.legalName.toLowerCase().includes(needle) ||
        p.services.some((s) => s.toLowerCase().includes(needle));
      return withinRadius && segmentOk && ratingOk && queryOk;
    })
    .sort((a, b) =>
      input.sort === "rating"
        ? (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0)
        : (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0),
    );
  return {
    items: all.slice(input.offset, input.offset + input.limit),
    total: all.length,
    limit: input.limit,
    offset: input.offset,
  };
}

/** BUS-03: pagina de proveedores cercanos, con fallback demo si el backend no responde. */
export function useNearbyProviders(params: NearbySearchParams | null) {
  return useQuery({
    queryKey: ["providers", "nearby", params],
    enabled: Boolean(params),
    placeholderData: (previous) => previous,
    queryFn: async (): Promise<ProviderSearchResult> => {
      const input = nearbySearchSchema.parse(params);
      const query = new URLSearchParams({
        lat: String(input.lat),
        lng: String(input.lng),
        radiusKm: String(input.radiusKm),
        limit: String(input.limit),
        offset: String(input.offset),
        sort: input.sort,
        onlyAvailable: String(input.onlyAvailable),
      });
      if (input.segment) query.set("segment", input.segment);
      if (input.serviceId) query.set("serviceId", input.serviceId);
      if (input.query) query.set("query", input.query);
      if (input.minRating != null) query.set("minRating", String(input.minRating));
      try {
        return await apiFetch<ProviderSearchResult>(`/api/providers/search?${query.toString()}`);
      } catch {
        return filterDemo(input);
      }
    },
  });
}

/** Detalle de un proveedor con fallback demo. */
export function useProvider(id: string | undefined) {
  return useQuery({
    queryKey: ["providers", "detail", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<ProviderDetail | null> => {
      if (!id) return null;
      try {
        return await apiFetch<ProviderDetail>(`/api/providers/${id}`);
      } catch {
        return findDemoProvider(id) ?? null;
      }
    },
  });
}

/** Resenas de un proveedor con fallback demo. */
export function useProviderReviews(providerId: string | undefined) {
  return useQuery({
    queryKey: ["reviews", providerId],
    enabled: Boolean(providerId),
    queryFn: async (): Promise<Review[]> => {
      if (!providerId) return [];
      try {
        return await apiFetch<Review[]>(`/api/providers/${providerId}/reviews`);
      } catch {
        return DEMO_REVIEWS[providerId] ?? [];
      }
    },
  });
}

/** Crear una solicitud (lead) de servicio. */
/** Crear una resena. */
export function useCreateReview() {
  return useMutation({
    mutationFn: (input: ReviewCreateInput) =>
      apiFetch<Review>("/api/reviews", { method: "POST", body: input }),
  });
}
