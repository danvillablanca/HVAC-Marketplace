import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ProviderProfile,
  ProviderProfileInput,
  ServiceCatalogItem,
  VerificationRequestInput,
} from "@hvac/shared";
import { apiFetch } from "@/lib/api";

const PROFILE_KEY = ["provider-profile"] as const;

/** Perfil del proveedor autenticado; null si aun no lo completa. */
export function useMyProviderProfile() {
  return useQuery({
    queryKey: PROFILE_KEY,
    queryFn: () => apiFetch<ProviderProfile | null>("/api/providers/me"),
  });
}

export function useSaveProviderProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProviderProfileInput) =>
      apiFetch<ProviderProfile>("/api/providers/me", { method: "PUT", body: input }),
    onSuccess: (profile) => queryClient.setQueryData(PROFILE_KEY, profile),
  });
}

export function useRequestVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: VerificationRequestInput) =>
      apiFetch<ProviderProfile>("/api/providers/me/verification", { method: "POST", body: input }),
    onSuccess: (profile) => queryClient.setQueryData(PROFILE_KEY, profile),
  });
}

export function useServiceCatalog() {
  return useQuery({
    queryKey: ["service-catalog"],
    queryFn: () => apiFetch<ServiceCatalogItem[]>("/api/catalog/services"),
    staleTime: Infinity,
  });
}
