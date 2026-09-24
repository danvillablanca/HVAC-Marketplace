import { z } from "zod";
import { SERVICE_SEGMENTS } from "../types/index";
import { rutSchema, phoneSchema } from "./auth";

export const providerServiceSchema = z.object({
  serviceId: z.string().uuid(),
  priceFrom: z.number().int().nonnegative().nullable().optional(),
  unit: z.string().trim().max(40).nullable().optional(),
});

export const providerUpsertSchema = z.object({
  legalName: z.string().trim().min(3, "Razon social demasiado corta").max(160),
  rut: rutSchema,
  email: z.string().trim().toLowerCase().email("Correo invalido"),
  phone: phoneSchema,
  description: z.string().trim().max(2000).optional(),
  segment: z.enum(SERVICE_SEGMENTS),
  address: z.string().trim().min(4).max(200),
  commune: z.string().trim().min(2).max(80),
  region: z.string().trim().min(2).max(80),
  lat: z.number().gte(-56).lte(-17),
  lng: z.number().gte(-76).lte(-66),
  modalities: z.array(z.string().trim().min(2).max(40)).max(10).default([]),
  services: z.array(providerServiceSchema).max(50).default([]),
});
export type ProviderUpsertInput = z.infer<typeof providerUpsertSchema>;

export const verificationDecisionSchema = z.object({
  providerId: z.string().uuid(),
  decision: z.enum(["verificado", "rechazado", "en_revision"]),
  note: z.string().trim().max(500).optional(),
});
export type VerificationDecisionInput = z.infer<typeof verificationDecisionSchema>;
