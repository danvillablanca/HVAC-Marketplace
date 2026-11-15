import { randomUUID } from "node:crypto";
import type { Review, ReviewCreateInput } from "@hvac/shared";
import { getServiceClient } from "../lib/supabase";
import { isDemoMode } from "../lib/env";
import { HttpError } from "../lib/http";
import { addDemoReview } from "../data/demo";
import { mapReviewRow } from "./mappers";

export async function createReview(input: ReviewCreateInput, clientId: string): Promise<Review> {
  const supabase = getServiceClient();
  if (!supabase) {
    if (!isDemoMode) throw new HttpError("service_unavailable", "Base de datos no disponible", 503);
    return addDemoReview({
      id: randomUUID(),
      providerId: input.providerId,
      rating: input.rating,
      comment: input.comment ?? null,
      authorName: "Cliente",
      createdAt: new Date().toISOString(),
      verified: false,
    });
  }

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      provider_id: input.providerId,
      client_id: clientId,
      lead_id: input.leadId ?? null,
      rating: input.rating,
      comment: input.comment ?? null,
      author_name: "Cliente",
      verified: false,
    })
    .select("*")
    .single();
  if (error) {
    throw new HttpError("db_error", "No se pudo crear la reseña", 502, error.message);
  }
  return mapReviewRow(data);
}
