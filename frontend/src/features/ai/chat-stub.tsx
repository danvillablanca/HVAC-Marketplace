import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Bot, Info, MapPin, Search, Send, Sparkles, User } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ChatStubProps {
  suggestions?: string[];
  className?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatReply {
  reply?: string;
  message?: string;
  answer?: string;
}

const GREETING =
  "Hola, soy el asistente HVAC. Puedo orientarte sobre servicios, proveedores y regiones de Chile. ¿Que necesitas?";

const FALLBACK_REPLY =
  "El asistente IA estara disponible en E2/E3. Por ahora puedes explorar el mapa de proveedores en /mapa o buscar proveedores verificados en /buscar.";

const DISCLAIMER =
  "Asistente en modo demostracion. Las respuestas son orientativas y no constituyen asesoria tecnica.";

let messageCounter = 0;
function nextId(): string {
  messageCounter += 1;
  return `msg-${messageCounter}`;
}

export function ChatStub({ suggestions = [], className }: ChatStubProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: nextId(), role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || sending) return;

    setMessages((current) => [...current, { id: nextId(), role: "user", content }]);
    setInput("");
    setSending(true);

    try {
      const data = await apiFetch<ChatReply>("/api/ai/chat", {
        method: "POST",
        body: { message: content },
      });
      const reply = data?.reply ?? data?.message ?? data?.answer ?? FALLBACK_REPLY;
      setMessages((current) => [...current, { id: nextId(), role: "assistant", content: reply }]);
    } catch {
      setMessages((current) => [
        ...current,
        { id: nextId(), role: "assistant", content: FALLBACK_REPLY },
      ]);
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(input);
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-label="Conversacion con el asistente"
        className="flex max-h-[26rem] min-h-[18rem] flex-col gap-4 overflow-y-auto rounded-xl border border-border bg-card p-4"
      >
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "flex items-start gap-3",
              message.role === "user" ? "flex-row-reverse" : "flex-row",
            )}
          >
            <span
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-full",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground",
              )}
              aria-hidden
            >
              {message.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
            </span>
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                message.role === "user"
                  ? "rounded-tr-sm bg-primary text-primary-foreground"
                  : "rounded-tl-sm bg-secondary text-secondary-foreground",
              )}
            >
              {message.content}
            </div>
          </motion.div>
        ))}
        {sending && (
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-full bg-secondary" aria-hidden>
              <Bot className="size-4" />
            </span>
            <div className="rounded-2xl rounded-tl-sm bg-secondary px-4 py-2 text-sm text-muted-foreground">
              Escribiendo...
            </div>
          </div>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => void send(suggestion)}
              disabled={sending}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
            >
              <Sparkles className="size-3" />
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <label htmlFor="chat-input" className="sr-only">
          Escribe tu consulta
        </label>
        <Input
          id="chat-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Pregunta por servicios, regiones o proveedores..."
          disabled={sending}
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Enviar mensaje"
          disabled={sending || !input.trim()}
        >
          <Send className="size-4" />
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Info className="size-3.5" />
          {DISCLAIMER}
        </span>
        <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs">
          <Link to="/mapa" className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" /> /mapa
          </Link>
        </Button>
        <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs">
          <Link to="/buscar" className="inline-flex items-center gap-1">
            <Search className="size-3.5" /> /buscar
          </Link>
        </Button>
      </div>
    </div>
  );
}
