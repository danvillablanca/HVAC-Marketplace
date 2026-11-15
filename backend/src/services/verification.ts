import type {
  ProviderSummary,
  ProviderVerificationStatus,
  VerificationDecisionInput,
} from "@hvac/shared";
import { getServiceClient } from "../lib/supabase";
import { isDemoMode } from "../lib/env";
import { HttpError } from "../lib/http";
import { demoProviders, getDemoProvider, toProviderSummary } from "../data/demo";
import { mapProviderSummaryRow } from "./mappers";
import { applyDemoDecision } from "./provider-profile";
import { createNotification } from "./notifications";

/** Notifica al proveedor el resultado de su verificacion (REQ-VER-02, NOT-01). */
async function notifyDecision(
  userId: string | null,
  providerId: string,
  decision: ProviderVerificationStatus,
  note: string | null,
): Promise<void> {
  if (!userId || (decision !== "verificado" && decision !== "rechazado")) return;
  await createNotification({
    userId,
    type: decision === "verificado" ? "verificacion_aprobada" : "verificacion_rechazada",
    title:
      decision === "verificado" ? "Tu empresa fue verificada" : "Tu verificación fue rechazada",
    body:
      decision === "verificado"
        ? "Ya apareces en las búsquedas y puedes cotizar solicitudes."
        : `Motivo: ${note ?? "sin detalle"}. Corrige tu perfil y vuelve a enviarlo.`,
    refType: "provider",
    refId: providerId,
  }).catch(() => undefined);
}

export interface VerificationDecisionResult {
  providerId: string;
  status: ProviderVerificationStatus;
}

export async function listPendingVerifications(): Promise<ProviderSummary[]> {
  const supabase = getServiceClient();
  if (!supabase) {
    if (!isDemoMode) throw new HttpError("service_unavailable", "Base de datos no disponible", 503);
    return demoProviders
      .filter(
        (provider) =>
          provider.verificationStatus === "pendiente" ||
          provider.verificationStatus === "en_revision",
      )
      .map((provider) => toProviderSummary(provider));
  }

  const { data, error } = await supabase
    .from("providers")
    .select("*")
    .in("verification_status", ["pendiente", "en_revision"])
    .order("created_at", { ascending: true });
  if (error) {
    throw new HttpError("db_error", "No se pudo listar verificaciones", 502, error.message);
  }
  const rows = (data ?? []) as Array<Record<string, any>>;
  return rows.map((row) => mapProviderSummaryRow(row));
}

export async function decideVerification(
  input: VerificationDecisionInput,
  adminId: string,
): Promise<VerificationDecisionResult> {
  const supabase = getServiceClient();
  if (!supabase) {
    if (!isDemoMode) throw new HttpError("service_unavailable", "Base de datos no disponible", 503);
    const provider = getDemoProvider(input.providerId);
    if (!provider) throw new HttpError("not_found", "Proveedor no encontrado", 404);
    provider.verificationStatus = input.decision;
    const ownerId = applyDemoDecision(provider.id, input.decision, input.note ?? null);
    await notifyDecision(ownerId, provider.id, input.decision, input.note ?? null);
    return { providerId: provider.id, status: provider.verificationStatus };
  }

  const updateData: Record<string, unknown> = {
    verification_status: input.decision,
    verification_note: input.decision === "rechazado" ? (input.note ?? null) : null,
  };
  if (input.decision === "verificado") {
    updateData.verified_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("providers")
    .update(updateData)
    .eq("id", input.providerId)
    .select("id, user_id, verification_status")
    .maybeSingle();
  if (error) {
    throw new HttpError("db_error", "No se pudo actualizar la verificación", 502, error.message);
  }
  if (!data) throw new HttpError("not_found", "Proveedor no encontrado", 404);

  // Registrar en audit_log
  await supabase.from("audit_log").insert({
    actor_id: adminId,
    action: `verification_${input.decision}`,
    entity: "providers",
    entity_id: input.providerId,
    payload: { note: input.note ?? null },
  });

  // Los items enviados por el proveedor quedan con la misma decision.
  await supabase
    .from("verification_items")
    .update({
      status: input.decision,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      note: input.note ?? null,
    })
    .eq("provider_id", input.providerId)
    .in("status", ["pendiente", "en_revision"]);

  await notifyDecision(data.user_id ?? null, String(data.id), input.decision, input.note ?? null);

  return {
    providerId: String(data.id),
    status: data.verification_status as ProviderVerificationStatus,
  };
}
