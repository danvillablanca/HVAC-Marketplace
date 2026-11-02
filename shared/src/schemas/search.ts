import { z } from "zod";
import { SERVICE_SEGMENTS } from "../types/index";

export const nearbySearchSchema = z.object({
  lat: z.coerce.number().gte(-56).lte(-17),
  lng: z.coerce.number().gte(-76).lte(-66),
  /** BUS-02: radio por defecto de 10 km. */
  radiusKm: z.coerce.number().min(1).max(100).default(10),
  segment: z.enum(SERVICE_SEGMENTS).optional(),
  serviceId: z.string().uuid().optional(),
  query: z.string().trim().max(120).optional(),
  /** BUS-03: calificacion minima (0-5). */
  minRating: z.coerce.number().min(0).max(5).optional(),
  /** BUS-03: solo proveedores disponibles (PRO-06). */
  onlyAvailable: z
    .union([z.boolean(), z.enum(["true", "false"]).transform((v) => v === "true")])
    .default(false),
  sort: z.enum(["distance", "rating"]).default("distance"),
  /** BUS-03: paginacion de 10 resultados. */
  limit: z.coerce.number().int().min(1).max(50).default(10),
  offset: z.coerce.number().int().min(0).default(0),
});
export type NearbySearchInput = z.infer<typeof nearbySearchSchema>;
/** Parametros que arma el cliente (los opcionales toman su valor por defecto). */
export type NearbySearchParams = z.input<typeof nearbySearchSchema>;

export const chatSchema = z.object({
  sessionId: z.string().trim().max(80).optional(),
  message: z.string().trim().min(1).max(2000),
});
export type ChatInput = z.infer<typeof chatSchema>;
