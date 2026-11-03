import { useEffect, useRef, useState, type FormEvent } from "react";
import { MessageCircle, Send } from "lucide-react";
import { messageCreateSchema } from "@hvac/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth";
import { useRealtimeInvalidate } from "@/lib/realtime";
import { cn } from "@/lib/utils";
import { messagesKey, threadsKey, useMessages, useSendMessage, useThreads } from "./hooks";

const POLL_MS = 5_000;

function time(iso: string): string {
  return new Date(iso).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });
}

/** REQ-MSG-01: conversacion entre el cliente y cada proveedor que cotizo. */
export function RequestChat({ requestId }: { requestId: string }) {
  const { role } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);

  // En vivo con Realtime; en modo demo, polling.
  const live = useRealtimeInvalidate("messages", `request_id=eq.${requestId}`, [
    ["chat", requestId],
  ]);
  const poll = live ? false : POLL_MS;
  const threads = useThreads(requestId, poll);
  // Sin seleccion explicita, el primer hilo (evita enviar sin proveedor mientras carga).
  const providerId = selected ?? threads.data?.[0]?.providerId ?? null;
  const messages = useMessages(requestId, providerId, poll);
  const send = useSendMessage(requestId);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [messages.data?.length]);

  if (threads.isLoading || threads.isError || !threads.data || threads.data.length === 0)
    return null;

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const parsed = messageCreateSchema.safeParse({
      body: draft,
      providerId: providerId ?? undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Mensaje inválido");
      return;
    }
    try {
      await send.mutateAsync(parsed.data);
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el mensaje.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="size-5 text-primary" />
          Mensajes
        </CardTitle>
        <CardDescription>
          {role === "cliente"
            ? "Conversa con cada proveedor que cotizó tu solicitud."
            : "Conversa con el cliente sobre tu cotización."}
          {live && <span className="ml-1 text-success">· En vivo</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {role === "cliente" && threads.data.length > 1 && (
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Conversaciones">
            {threads.data.map((thread) => (
              <Button
                key={thread.providerId}
                role="tab"
                aria-selected={thread.providerId === providerId}
                variant={thread.providerId === providerId ? "default" : "outline"}
                size="sm"
                onClick={() => setSelected(thread.providerId)}
              >
                {thread.providerName ?? "Proveedor"}
                {thread.unread > 0 && (
                  <Badge
                    variant="warning"
                    className="ml-1"
                    aria-label={`${thread.unread} sin leer`}
                  >
                    {thread.unread}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        )}

        <div
          className="max-h-80 space-y-2 overflow-y-auto rounded-md border border-border p-3"
          aria-live="polite"
          aria-label="Historial de mensajes"
        >
          {messages.data?.length ? (
            messages.data.map((message) => (
              <div
                key={message.id}
                className={cn("flex", message.mine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                    message.mine ? "bg-primary text-primary-foreground" : "bg-secondary",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{message.body}</p>
                  <p
                    className={cn(
                      "mt-1 text-[11px]",
                      message.mine ? "opacity-80" : "text-muted-foreground",
                    )}
                  >
                    {time(message.createdAt)}
                    {message.mine && message.readAt ? " · Leído" : ""}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Aún no hay mensajes. Escribe el primero.
            </p>
          )}
          <div ref={endRef} />
        </div>

        <form onSubmit={handleSend} className="flex items-end gap-2">
          <Textarea
            aria-label="Escribe un mensaje"
            rows={2}
            maxLength={2000}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="Escribe un mensaje..."
          />
          <Button
            type="submit"
            disabled={send.isPending || !draft.trim()}
            aria-label="Enviar mensaje"
          >
            <Send className="size-4" />
          </Button>
        </form>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export { messagesKey, threadsKey };
