import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CancellationMetricsResponse,
  DateRange,
  ProviderSummary,
  VerificationDecisionInput,
} from "@hvac/shared";
import { apiFetch } from "@/lib/api";

/** Lista proveedores pendientes de verificación. */
export function usePendingVerifications() {
  return useQuery({
    queryKey: ["admin", "verifications"],
    queryFn: () => apiFetch<ProviderSummary[]>("/api/admin/verifications"),
  });
}

/** Decidir verificación (aprobar/rechazar). */
export function useDecideVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: VerificationDecisionInput) =>
      apiFetch<{ providerId: string; status: string }>("/api/admin/verifications", {
        method: "PATCH",
        body: input,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "verifications"] });
    },
  });
}

/** Motivos de cancelación de toda la plataforma en el rango. */
export function useCancellationMetrics(range: DateRange) {
  return useQuery({
    queryKey: ["admin", "cancellation-metrics", range.from, range.to],
    queryFn: () =>
      apiFetch<CancellationMetricsResponse>(
        `/api/admin/metrics/cancellations?from=${range.from}&to=${range.to}`,
      ),
  });
}
