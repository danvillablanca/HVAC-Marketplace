import { randomUUID } from "node:crypto";
import type { ChatMessage, ChatThread } from "@hvac/shared";
import type { AuthenticatedUser } from "../lib/auth";
import { getServiceClient } from "../lib/supabase";
import { HttpError } from "../lib/http";
import { createNotification } from "./notifications";
import { getThreadContext, type ThreadContext } from "./requests";

type Row = Record<string, any>;

interface StoredMessage {
  id: string;
  requestId: string;
  providerId: string;
  senderId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

// Modo demo: mensajes en memoria.
const demoMessages: StoredMessage[] = [];

/**
 * MSG-01: resuelve el hilo al que el usuario puede acceder. El cliente elige el
 * proveedor (uno de los que cotizaron); el proveedor solo accede a su propio hilo.
 */
function resolveThread(
  ctx: ThreadContext,
  user: AuthenticatedUser,
  providerId?: string,
): { providerId: string; recipientId: string | null } {
  if (user.role === "cliente") {
    if (ctx.clientId !== user.id)
      throw new HttpError("forbidden", "No participas en esta conversación", 403);
    const provider = ctx.providers.find((p) => p.providerId === providerId);
    if (!provider)
      throw new HttpError("not_found", "Ese proveedor no ha cotizado esta solicitud", 404);
    return { providerId: provider.providerId, recipientId: provider.userId };
  }
  if (user.role === "proveedor") {
    const own = ctx.providers.find((p) => p.userId === user.id);
    if (!own)
      throw new HttpError("forbidden", "El chat se habilita cuando envías una cotización", 403);
    return { providerId: own.providerId, recipientId: ctx.clientId };
  }
  if (user.role === "admin" && providerId) return { providerId, recipientId: null };
  throw new HttpError("forbidden", "No participas en esta conversación", 403);
}

function toChat(m: StoredMessage, userId: string): ChatMessage {
  return { ...m, mine: m.senderId === userId };
}

function mapRow(row: Row): StoredMessage {
  return {
    id: String(row.id),
    requestId: String(row.request_id),
    providerId: String(row.provider_id),
    senderId: String(row.sender_id),
    body: String(row.body),
    readAt: row.read_at ?? null,
    createdAt: String(row.created_at),
  };
}

/** Hilos visibles para el usuario en una solicitud, con no leidos y ultimo mensaje. */
export async function listThreads(
  requestId: string,
  user: AuthenticatedUser,
): Promise<ChatThread[]> {
  const ctx = await getThreadContext(requestId);
  const providers =
    user.role === "proveedor"
      ? ctx.providers.filter((p) => p.userId === user.id)
      : user.role === "cliente" && ctx.clientId === user.id
        ? ctx.providers
        : user.role === "admin"
          ? ctx.providers
          : [];
  if (providers.length === 0 && user.role !== "admin") {
    if (user.role === "cliente" && ctx.clientId === user.id) return [];
    throw new HttpError("forbidden", "No participas en esta conversación", 403);
  }

  const db = getServiceClient();
  let all: StoredMessage[];
  if (!db) {
    all = demoMessages.filter((m) => m.requestId === requestId);
  } else {
    const { data } = await db
      .from("messages")
      .select("*")
      .eq("request_id", requestId)
      .order("created_at", { ascending: true });
    all = (data ?? []).map(mapRow);
  }

  return providers.map((p) => {
    const thread = all.filter((m) => m.providerId === p.providerId);
    const last = thread.at(-1);
    return {
      requestId,
      providerId: p.providerId,
      providerName: p.providerName,
      unread: thread.filter((m) => m.senderId !== user.id && !m.readAt).length,
      lastMessage: last?.body ?? null,
      lastAt: last?.createdAt ?? null,
    };
  });
}

/** Historial persistente del hilo; marca como leidos los mensajes recibidos. */
export async function listMessages(
  requestId: string,
  user: AuthenticatedUser,
  providerId?: string,
): Promise<ChatMessage[]> {
  const ctx = await getThreadContext(requestId);
  const thread = resolveThread(ctx, user, providerId);
  const now = new Date().toISOString();
  const db = getServiceClient();

  if (!db) {
    const messages = demoMessages.filter(
      (m) => m.requestId === requestId && m.providerId === thread.providerId,
    );
    if (user.role !== "admin") {
      messages.filter((m) => m.senderId !== user.id && !m.readAt).forEach((m) => (m.readAt = now));
    }
    return messages.map((m) => toChat(m, user.id));
  }

  const { data, error } = await db
    .from("messages")
    .select("*")
    .eq("request_id", requestId)
    .eq("provider_id", thread.providerId)
    .order("created_at", { ascending: true });
  if (error)
    throw new HttpError("db_error", "No se pudieron obtener los mensajes", 502, error.message);
  if (user.role !== "admin") {
    await db
      .from("messages")
      .update({ read_at: now })
      .eq("request_id", requestId)
      .eq("provider_id", thread.providerId)
      .neq("sender_id", user.id)
      .is("read_at", null);
  }
  return (data ?? []).map((row: Row) => toChat(mapRow(row), user.id));
}

/** Envia un mensaje y avisa al otro participante (NOT-01). */
export async function sendMessage(
  requestId: string,
  user: AuthenticatedUser,
  body: string,
  providerId?: string,
): Promise<ChatMessage> {
  if (user.role === "admin")
    throw new HttpError("forbidden", "El admin no participa en los chats", 403);
  const ctx = await getThreadContext(requestId);
  const thread = resolveThread(ctx, user, providerId);
  const db = getServiceClient();
  let stored: StoredMessage;

  if (!db) {
    stored = {
      id: randomUUID(),
      requestId,
      providerId: thread.providerId,
      senderId: user.id,
      body,
      readAt: null,
      createdAt: new Date().toISOString(),
    };
    demoMessages.push(stored);
  } else {
    const { data, error } = await db
      .from("messages")
      .insert({ request_id: requestId, provider_id: thread.providerId, sender_id: user.id, body })
      .select("*")
      .single();
    if (error) throw new HttpError("db_error", "No se pudo enviar el mensaje", 502, error.message);
    stored = mapRow(data);
  }

  if (thread.recipientId) {
    const from =
      user.role === "proveedor"
        ? (ctx.providers.find((p) => p.providerId === thread.providerId)?.providerName ??
          "El proveedor")
        : "El cliente";
    void createNotification({
      userId: thread.recipientId,
      type: "nuevo_mensaje",
      title: `Nuevo mensaje de ${from}`,
      body: body.length > 120 ? `${body.slice(0, 117)}...` : body,
      refType: "request",
      refId: requestId,
    }).catch(() => undefined);
  }
  return toChat(stored, user.id);
}
