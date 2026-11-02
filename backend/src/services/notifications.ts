import { randomUUID } from "node:crypto";
import type { Notification, NotificationType } from "@hvac/shared";
import { getServiceClient } from "../lib/supabase";
import { isDemoMode } from "../lib/env";
import { HttpError } from "../lib/http";

// ---- Demo fallback ----
const demoNotifications: Notification[] = [];

function mapRow(row: Record<string, any>): Notification {
  return {
    id: String(row.id),
    userId: String(row.user_id ?? row.userId ?? ""),
    type: row.type as NotificationType,
    title: String(row.title ?? ""),
    body: row.body ?? null,
    refType: row.ref_type ?? row.refType ?? null,
    refId: row.ref_id ?? row.refId ?? null,
    read: Boolean(row.read),
    createdAt: String(row.created_at ?? row.createdAt ?? new Date().toISOString()),
  };
}

export async function listNotifications(userId: string): Promise<Notification[]> {
  const supabase = getServiceClient();
  if (!supabase) {
    if (!isDemoMode) throw new HttpError("service_unavailable", "Base de datos no disponible", 503);
    return demoNotifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error)
    throw new HttpError("db_error", "No se pudieron listar las notificaciones", 502, error.message);
  return (data ?? []).map(mapRow);
}

export async function markRead(notificationId: string, userId: string): Promise<Notification> {
  const supabase = getServiceClient();
  if (!supabase) {
    if (!isDemoMode) throw new HttpError("service_unavailable", "Base de datos no disponible", 503);
    const n = demoNotifications.find((n) => n.id === notificationId && n.userId === userId);
    if (!n) throw new HttpError("not_found", "Notificación no encontrada", 404);
    n.read = true;
    return n;
  }

  const { data, error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw new HttpError("not_found", "Notificación no encontrada", 404);
  return mapRow(data);
}

export async function markAllRead(userId: string): Promise<number> {
  const supabase = getServiceClient();
  if (!supabase) {
    if (!isDemoMode) throw new HttpError("service_unavailable", "Base de datos no disponible", 503);
    let count = 0;
    for (const n of demoNotifications) {
      if (n.userId === userId && !n.read) {
        n.read = true;
        count++;
      }
    }
    return count;
  }

  const { count, error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false)
    .select("*", { count: "exact", head: true });

  if (error) throw new HttpError("db_error", "Error al marcar notificaciones", 502, error.message);
  return count ?? 0;
}

export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  refType?: string;
  refId?: string;
}): Promise<Notification> {
  const supabase = getServiceClient();
  if (!supabase) {
    if (!isDemoMode) throw new HttpError("service_unavailable", "Base de datos no disponible", 503);
    const n: Notification = {
      id: randomUUID(),
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body ?? null,
      refType: params.refType ?? null,
      refId: params.refId ?? null,
      read: false,
      createdAt: new Date().toISOString(),
    };
    demoNotifications.push(n);
    return n;
  }

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      body: params.body ?? null,
      ref_type: params.refType ?? null,
      ref_id: params.refId ?? null,
    })
    .select("*")
    .single();

  if (error)
    throw new HttpError("db_error", "No se pudo crear la notificación", 502, error.message);
  return mapRow(data);
}

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = getServiceClient();
  if (!supabase) {
    if (!isDemoMode) throw new HttpError("service_unavailable", "Base de datos no disponible", 503);
    return demoNotifications.filter((n) => n.userId === userId && !n.read).length;
  }

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) throw new HttpError("db_error", "Error al contar notificaciones", 502, error.message);
  return count ?? 0;
}
