import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  LeadCreateInput,
  NearbySearchInput,
  ProviderDetail,
  ProviderSummary,
  Review,
  ReviewCreateInput,
} from "@hvac/shared";
import { apiFetch } from "@/lib/api";
import { env } from "@/lib/env";
import { distanceMeters } from "@/lib/geo";
import { DEMO_PROVIDERS, DEMO_REVIEWS, findDemoProvider } from "@/data/providers";

function toSummary(
  provider: ProviderDetail,
  origin?: { lat: number; lng: number },
): ProviderSummary {
  const distance = origin && provider.location ? distanceMeters(origin, provider.location) : null;
  return { ...provider, distanceMeters: distance };
}

function filterDemo(input: NearbySearchInput): ProviderSummary[] {
  const origin = { lat: input.lat, lng: input.lng };
  return DEMO_PROVIDERS.map((p) => toSummary(p, origin))
    .filter((p) => {
      const radius = input.radiusKm * 1000;
      const withinRadius = p.distanceMeters !== null && p.distanceMeters <= radius;
      const segmentOk = !input.segment || p.segment === input.segment;
      const queryOk =
        !input.query ||
        p.legalName.toLowerCase().includes(input.query.toLowerCase()) ||
        p.services.some((s) => s.toLowerCase().includes(input.query!.toLowerCase()));
      return withinRadius && segmentOk && queryOk;
    })
    .sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0))
    .slice(0, input.limit);
}

/** Proveedores cercanos con fallback a datos demo si el backend no responde. */
export function useNearbyProviders(input: NearbySearchInput | null) {
  return useQuery({
    queryKey: ["providers", "nearby", input],
    enabled: Boolean(input),
    queryFn: async (): Promise<ProviderSummary[]> => {
      if (!input) return [];
      const params = new URLSearchParams({
        lat: String(input.lat),
        lng: String(input.lng),
        radiusKm: String(input.radiusKm),
        limit: String(input.limit),
      });
      if (input.segment) params.set("segment", input.segment);
      if (input.query) params.set("query", input.query);
      try {
        return await apiFetch<ProviderSummary[]>(`/api/providers/search?${params.toString()}`);
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

/** Id local para registros simulados en modo demo. */
function demoId(prefix: string): string {
  return `${prefix}-demo-${Date.now().toString(36)}`;
}

/** Crear una solicitud (lead) de servicio. En modo demo se simula el envio. */
export function useCreateLead() {
  return useMutation({
    mutationFn: async (input: LeadCreateInput) => {
      if (env.demoMode) return { id: demoId("lead") };
      return apiFetch<{ id: string }>("/api/leads", { method: "POST", body: input });
    },
  });
}

/** Crear una resena. En modo demo se guarda en memoria y aparece en la lista. */
export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ReviewCreateInput): Promise<Review> => {
      if (env.demoMode) {
        const review: Review = {
          id: demoId("review"),
          providerId: input.providerId,
          rating: input.rating,
          comment: input.comment ?? null,
          authorName: "Usuario demo",
          createdAt: new Date().toISOString(),
          verified: false,
        };
        // La resena nueva queda primera en la lista del proveedor (solo en esta pestana).
        DEMO_REVIEWS[input.providerId] = [review, ...(DEMO_REVIEWS[input.providerId] ?? [])];
        return review;
      }
      return apiFetch<Review>("/api/reviews", { method: "POST", body: input });
    },
    onSuccess: (review) => {
      // Refresca la lista de resenas del proveedor.
      void queryClient.invalidateQueries({ queryKey: ["reviews", review.providerId] });
    },
  });
}
