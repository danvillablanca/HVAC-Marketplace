import type {
  ProviderSummary,
  ProviderVerificationStatus,
  VerificationDecisionInput,
} from "@hvac/shared";
import { getServiceClient } from "../lib/supabase";
import { HttpError } from "../lib/http";
import { demoProviders, getDemoProvider, toProviderSummary } from "../data/demo";
import { mapProviderSummaryRow } from "./mappers";

export interface VerificationDecisionResult {
  providerId: string;
  status: ProviderVerificationStatus;
}

export async function listPendingVerifications(): Promise<ProviderSummary[]> {
  const supabase = getServiceClient();
  if (!supabase) {
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
): Promise<VerificationDecisionResult> {
  const supabase = getServiceClient();
  if (!supabase) {
    const provider = getDemoProvider(input.providerId);
    if (!provider) throw new HttpError("not_found", "Proveedor no encontrado", 404);
    provider.verificationStatus = input.decision;
    return { providerId: provider.id, status: provider.verificationStatus };
  }

  const { data, error } = await supabase
    .from("providers")
    .update({ verification_status: input.decision })
    .eq("id", input.providerId)
    .select("id, verification_status")
    .maybeSingle();
  if (error) {
    throw new HttpError("db_error", "No se pudo actualizar la verificación", 502, error.message);
  }
  if (!data) throw new HttpError("not_found", "Proveedor no encontrado", 404);
  return {
    providerId: String(data.id),
    status: data.verification_status as ProviderVerificationStatus,
  };
}
