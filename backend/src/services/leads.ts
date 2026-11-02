import { randomUUID } from "node:crypto";
import type { Lead, LeadCreateInput, LeadUpdateInput, UserRole } from "@hvac/shared";
import { getServiceClient } from "../lib/supabase";
import { isDemoMode } from "../lib/env";
import { HttpError } from "../lib/http";
import { mapLeadRow } from "./mappers";

const demoLeads = new Map<string, Lead>();

export async function listLeads(userId: string, role: UserRole): Promise<Lead[]> {
  const supabase = getServiceClient();
  if (!supabase) {
    if (!isDemoMode) throw new HttpError("service_unavailable", "Base de datos no disponible", 503);
    return [...demoLeads.values()].filter((lead) => role === "admin" || lead.clientId === userId);
  }

  let query = supabase.from("leads").select("*").order("created_at", { ascending: false });

  // Los clientes solo ven sus propios leads; admin ve todos
  if (role === "cliente") {
    query = query.eq("client_id", userId);
  } else if (role === "proveedor") {
    // Los proveedores ven leads dirigidos a ellos (se filtra vía RLS también)
    query = query;
  }

  const { data, error } = await query;
  if (error) {
    throw new HttpError("db_error", "No se pudieron listar las solicitudes", 502, error.message);
  }
  const rows = (data ?? []) as Array<Record<string, any>>;
  return rows.map((row) => mapLeadRow(row));
}

export async function createLead(input: LeadCreateInput, clientId: string): Promise<Lead> {
  const supabase = getServiceClient();
  if (!supabase) {
    if (!isDemoMode) throw new HttpError("service_unavailable", "Base de datos no disponible", 503);
    const lead: Lead = {
      id: randomUUID(),
      clientId,
      providerId: input.providerId,
      serviceId: input.serviceId ?? null,
      description: input.description,
      status: "nuevo",
      createdAt: new Date().toISOString(),
    };
    demoLeads.set(lead.id, lead);
    return lead;
  }

  const { data, error } = await supabase
    .from("leads")
    .insert({
      client_id: clientId,
      provider_id: input.providerId,
      service_id: input.serviceId ?? null,
      description: input.description,
      urgency: input.urgency,
      preferred_contact: input.preferredContact,
      status: "nuevo",
    })
    .select("*")
    .single();
  if (error) {
    throw new HttpError("db_error", "No se pudo crear la solicitud", 502, error.message);
  }
  return mapLeadRow(data);
}

export async function updateLead(
  id: string,
  input: LeadUpdateInput,
  userId: string,
  role: UserRole,
): Promise<Lead> {
  const supabase = getServiceClient();
  if (!supabase) {
    if (!isDemoMode) throw new HttpError("service_unavailable", "Base de datos no disponible", 503);
    const existing = demoLeads.get(id);
    if (!existing) throw new HttpError("not_found", "Solicitud no encontrada", 404);
    if (role !== "admin" && existing.clientId !== userId) {
      throw new HttpError("forbidden", "No puedes modificar esta solicitud", 403);
    }
    const updated: Lead = { ...existing, status: input.status };
    demoLeads.set(id, updated);
    return updated;
  }

  const { data, error } = await supabase
    .from("leads")
    .update({ status: input.status, note: input.note ?? null })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) {
    throw new HttpError("db_error", "No se pudo actualizar la solicitud", 502, error.message);
  }
  if (!data) throw new HttpError("not_found", "Solicitud no encontrada", 404);
  return mapLeadRow(data);
}
