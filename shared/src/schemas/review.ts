import { z } from "zod";

export const reviewCreateSchema = z.object({
  providerId: z.string().uuid(),
  leadId: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1500).optional(),
});
export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;
