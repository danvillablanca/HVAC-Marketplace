import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Notification } from "@hvac/shared";
import { apiFetch } from "@/lib/api";

/** Lista las últimas 50 notificaciones del usuario. */
export function useNotifications(pollMs: number | false = 30_000) {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiFetch<Notification[]>("/api/notifications"),
    refetchInterval: pollMs,
  });
}

/** Conteo de notificaciones no leídas (query ligera). */
export function useUnreadCount(pollMs: number | false = 15_000) {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => apiFetch<{ unread: number }>("/api/notifications?count=unread"),
    refetchInterval: pollMs,
    select: (data) => data.unread,
  });
}

/** Marca una notificación individual como leída. */
export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<Notification>(`/api/notifications/${id}`, {
        method: "PATCH",
        body: { read: true },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

/** Marca todas las notificaciones como leídas. */
export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<{ markedRead: number }>("/api/notifications", { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
