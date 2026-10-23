import { randomUUID } from "node:crypto";
import type { Lead, LeadCreateInput, LeadUpdateInput } from "@hvac/shared";
import { getServiceClient } from "../lib/supabase";
import { HttpError } from "../lib/http";
import { mapLeadRow } from "./mappers";

const DEMO_CLIENT_ID = "00000000-0000-0000-0000-000000000000";
const demoLeads = new Map<string, Lead>();

export async function listLeads(): Promise<Lead[]> {
  const supabase = getServiceClient();
  if (!supabase) return [...demoLeads.values()];

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    throw new HttpError("db_error", "No se pudieron listar las solicitudes", 502, error.message);
  }
  const rows = (data ?? []) as Array<Record<string, any>>;
  return rows.map((row) => mapLeadRow(row));
}

export async function createLead(input: LeadCreateInput, clientId?: string): Promise<Lead> {
  const supabase = getServiceClient();
  if (!supabase) {
    const lead: Lead = {
      id: randomUUID(),
      clientId: clientId ?? DEMO_CLIENT_ID,
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
      client_id: clientId ?? null,
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

export async function updateLead(id: string, input: LeadUpdateInput): Promise<Lead> {
  const supabase = getServiceClient();
  if (!supabase) {
    const existing = demoLeads.get(id);
    if (!existing) throw new HttpError("not_found", "Solicitud no encontrada", 404);
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
