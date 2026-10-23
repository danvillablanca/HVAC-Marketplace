import { randomUUID } from "node:crypto";
import type { Review, ReviewCreateInput } from "@hvac/shared";
import { getServiceClient } from "../lib/supabase";
import { HttpError } from "../lib/http";
import { addDemoReview } from "../data/demo";
import { mapReviewRow } from "./mappers";

export async function createReview(input: ReviewCreateInput): Promise<Review> {
  const supabase = getServiceClient();
  if (!supabase) {
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
