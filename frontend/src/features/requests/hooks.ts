import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ServiceRequest,
  ServiceRequestDetail,
  ServiceRequestCreateInput,
  ServiceRequestUpdateInput,
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
      queryClient.invalidateQueries({ queryKey: ["provider-metrics"] });
    },
  });
}

/** COT-02: el cliente acepta o rechaza una cotizacion. */
export function useDecideQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ quoteId, action }: { quoteId: string; action: "aceptar" | "rechazar" }) =>
      apiFetch<{ requestId: string; status: string }>(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        body: { action },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
    },
  });
}

/** COT-03: el cliente confirma el trabajo completado. */
export function useConfirmCompletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<ServiceRequest>(`/api/requests/${id}/confirm`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
    },
  });
}

/** Transicionar el estado de una solicitud. */
export function useTransitionRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & ServiceRequestUpdateInput) =>
      apiFetch<ServiceRequest>(`/api/requests/${id}`, {
        method: "PATCH",
        body,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["service-requests", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
    },
  });
}
