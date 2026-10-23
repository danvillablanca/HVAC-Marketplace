import type { ChatInput } from "@hvac/shared";
import { env, hasGemini } from "../lib/env";

export interface AiAnswer {
  answer: string;
  sources: string[];
  stub: boolean;
}

const STUB_ANSWER =
  "El asistente IA estará disponible en las próximas entregas (E2/E3). Por ahora puedes usar el " +
  "buscador para filtrar proveedores HVAC verificados por servicio, comuna y distancia.";

export async function answerQuestion(input: ChatInput): Promise<AiAnswer> {
  if (!hasGemini) {
    return { answer: STUB_ANSWER, sources: [], stub: true };
  }

  // Módulo RAG pendiente (E3): generar embeddings con env.geminiEmbeddingModel y consultar
  // Google GenAI (env.geminiChatModel) con el contexto de proveedores y reseñas antes de responder.
  return {
    answer:
      "El módulo de IA está configurado pero aún no implementado; se habilitará en E3. " +
      "Mientras tanto, usa el buscador para encontrar proveedores por servicio y cercanía.",
    sources: [],
    stub: true,
  };
}
