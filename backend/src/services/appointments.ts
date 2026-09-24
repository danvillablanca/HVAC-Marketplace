import { randomUUID } from "node:crypto";
import type { Appointment, AppointmentCreateInput, AppointmentUpdateInput } from "@hvac/shared";
import { getServiceClient } from "../lib/supabase";
import { HttpError } from "../lib/http";
import { mapAppointmentRow } from "./mappers";

const demoAppointments = new Map<string, Appointment>();

export async function createAppointment(input: AppointmentCreateInput): Promise<Appointment> {
  const supabase = getServiceClient();
  if (!supabase) {
    const appointment: Appointment = {
      id: randomUUID(),
      leadId: input.leadId,
      startsAt: input.startsAt,
      status: "propuesta",
    };
    demoAppointments.set(appointment.id, appointment);
    return appointment;
  }

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      lead_id: input.leadId,
      starts_at: input.startsAt,
      duration_minutes: input.durationMinutes,
      status: "propuesta",
    })
    .select("*")
    .single();
  if (error) {
    throw new HttpError("db_error", "No se pudo crear la cita", 502, error.message);
  }
  return mapAppointmentRow(data);
}

export async function updateAppointment(
  id: string,
  input: AppointmentUpdateInput,
): Promise<Appointment> {
  const supabase = getServiceClient();
  if (!supabase) {
    const existing = demoAppointments.get(id);
    if (!existing) throw new HttpError("not_found", "Cita no encontrada", 404);
    const updated: Appointment = { ...existing, status: input.status };
    demoAppointments.set(id, updated);
    return updated;
  }

  const { data, error } = await supabase
    .from("appointments")
    .update({ status: input.status })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) {
    throw new HttpError("db_error", "No se pudo actualizar la cita", 502, error.message);
  }
  if (!data) throw new HttpError("not_found", "Cita no encontrada", 404);
  return mapAppointmentRow(data);
}
