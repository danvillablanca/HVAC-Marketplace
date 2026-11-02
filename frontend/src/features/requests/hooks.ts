import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ServiceRequest,
  ServiceRequestDetail,
  ServiceRequestCreateInput,
  QuoteCreateInput,
  Quote,
} from "@hvac/shared";
import { apiFetch } from "@/lib/api";

/** Lista de solicitudes del usuario autenticado. */
export function useServiceRequests() {
  return useQuery({
    queryKey: ["service-requests"],
    queryFn: () => apiFetch<ServiceRequest[]>("/api/requests"),
  });
}

/** Detalle de una solicitud con cotizaciones y eventos. */
export function useServiceRequestDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["service-requests", id],
    enabled: Boolean(id),
    queryFn: () => apiFetch<ServiceRequestDetail>(`/api/requests/${id}`),
  });
}

/** Crear una solicitud de servicio. */
export function useCreateServiceRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ServiceRequestCreateInput) =>
      apiFetch<ServiceRequest>("/api/requests", { method: "POST", body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
    },
  });
}

/** Enviar una cotización (solo proveedores). */
export function useCreateQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: QuoteCreateInput) =>
      apiFetch<Quote>("/api/quotes", { method: "POST", body: input }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["service-requests", variables.requestId] });
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
    },
  });
}

/** Aceptar una cotización (solo cliente). */
export function useAcceptQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (quoteId: string) =>
      apiFetch<{ accepted: boolean }>(`/api/quotes/${quoteId}`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
    },
  });
}

/** Transicionar el estado de una solicitud. */
export function useTransitionRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) =>
      apiFetch<ServiceRequest>(`/api/requests/${id}`, {
        method: "PATCH",
        body: { status, note },
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["service-requests", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
    },
  });
}
