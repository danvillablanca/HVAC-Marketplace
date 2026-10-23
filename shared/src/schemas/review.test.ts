import { describe, it, expect } from "vitest";
import { reviewCreateSchema } from "./review";

const uuid = "00000000-0000-4000-8000-000000000000";

describe("schemas/review", () => {
  it("acepta una resena valida", () => {
    const result = reviewCreateSchema.safeParse({
      providerId: uuid,
      rating: 5,
      comment: "Excelente",
    });
    expect(result.success).toBe(true);
  });

  it("acepta una resena sin leadId ni comentario", () => {
    const result = reviewCreateSchema.safeParse({ providerId: uuid, rating: 1 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.leadId).toBeUndefined();
      expect(result.data.comment).toBeUndefined();
    }
  });

  it("acepta valores limite de rating (1 y 5)", () => {
    expect(reviewCreateSchema.safeParse({ providerId: uuid, rating: 1 }).success).toBe(true);
    expect(reviewCreateSchema.safeParse({ providerId: uuid, rating: 5 }).success).toBe(true);
  });

  it("rechaza rating fuera de rango o no entero", () => {
    expect(reviewCreateSchema.safeParse({ providerId: uuid, rating: 0 }).success).toBe(false);
    expect(reviewCreateSchema.safeParse({ providerId: uuid, rating: 6 }).success).toBe(false);
    expect(reviewCreateSchema.safeParse({ providerId: uuid, rating: 3.5 }).success).toBe(false);
  });

  it("rechaza providerId no UUID", () => {
    expect(reviewCreateSchema.safeParse({ providerId: "abc", rating: 5 }).success).toBe(false);
  });

  it("rechaza un leadId no UUID cuando se entrega", () => {
    expect(reviewCreateSchema.safeParse({ providerId: uuid, leadId: "x", rating: 4 }).success).toBe(
      false,
    );
  });

  it("rechaza un comentario mayor a 1500 caracteres", () => {
    expect(
      reviewCreateSchema.safeParse({ providerId: uuid, rating: 4, comment: "x".repeat(1501) })
        .success,
    ).toBe(false);
  });
});
