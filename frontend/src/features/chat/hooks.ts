import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ChatMessage, ChatThread } from "@hvac/shared";
import { apiFetch } from "@/lib/api";

export const threadsKey = (requestId: string) => ["chat", requestId, "threads"] as const;
export const messagesKey = (requestId: string, providerId: string | null) =>
  ["chat", requestId, "messages", providerId ?? "own"] as const;

export function useThreads(requestId: string, pollMs: number | false) {
  return useQuery({
    queryKey: threadsKey(requestId),
    queryFn: () => apiFetch<ChatThread[]>(`/api/requests/${requestId}/threads`),
    refetchInterval: pollMs,
  });
}

export function useMessages(requestId: string, providerId: string | null, pollMs: number | false) {
  return useQuery({
    queryKey: messagesKey(requestId, providerId),
    enabled: providerId !== null,
    queryFn: () =>
      apiFetch<ChatMessage[]>(
        `/api/requests/${requestId}/messages${providerId ? `?providerId=${encodeURIComponent(providerId)}` : ""}`,
      ),
    refetchInterval: pollMs,
  });
}

export function useSendMessage(requestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { body: string; providerId?: string }) =>
      apiFetch<ChatMessage>(`/api/requests/${requestId}/messages`, { method: "POST", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chat", requestId] }),
  });
}
