import { z } from "zod";
import { SERVICE_SEGMENTS } from "../types/index";

export const nearbySearchSchema = z.object({
  lat: z.coerce.number().gte(-56).lte(-17),
  lng: z.coerce.number().gte(-76).lte(-66),
  radiusKm: z.coerce.number().min(1).max(100).default(15),
  segment: z.enum(SERVICE_SEGMENTS).optional(),
  serviceId: z.string().uuid().optional(),
  query: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
export type NearbySearchInput = z.infer<typeof nearbySearchSchema>;

export const chatSchema = z.object({
  sessionId: z.string().trim().max(80).optional(),
  message: z.string().trim().min(1).max(2000),
});
export type ChatInput = z.infer<typeof chatSchema>;
