import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { reviewCreateSchema } from "@hvac/shared";
import { getDemoReviews } from "../data/demo";
import { createReview } from "./reviews";

describe("createReview (fallback demo)", () => {
  it("crea una reseña con id, autor y verificación por defecto", async () => {
    const input = reviewCreateSchema.parse({
      providerId: randomUUID(),
      rating: 5,
      comment: "Trabajo impecable",
    });

    const review = await createReview(input);

    expect(review.providerId).toBe(input.providerId);
    expect(review.rating).toBe(5);
    expect(review.comment).toBe("Trabajo impecable");
    expect(review.authorName).toBe("Cliente");
    expect(review.verified).toBe(false);
    expect(review.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(Number.isNaN(Date.parse(review.createdAt))).toBe(false);
  });

  it("persiste la reseña en el store demo", async () => {
    const input = reviewCreateSchema.parse({
      providerId: randomUUID(),
      rating: 4,
    });

    const review = await createReview(input);
    expect(getDemoReviews(input.providerId)).toContainEqual(review);
  });

  it("normaliza comment ausente a null", async () => {
    const input = reviewCreateSchema.parse({
      providerId: randomUUID(),
      rating: 3,
    });

    const review = await createReview(input);
    expect(review.comment).toBeNull();
  });
});
