import { z } from "zod";
import { SERVICE_SEGMENTS } from "../types/index";
import { rutSchema, phoneSchema } from "./auth";
import { WEEK_DAYS } from "../utils/constants";

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

const HOUR = /^([01]\d|2[0-3]):[0-5]\d$/;
const dayHoursSchema = z
  .object({
    open: z.string().regex(HOUR, "Hora invalida"),
    close: z.string().regex(HOUR, "Hora invalida"),
  })
  .refine((d) => d.open < d.close, {
    message: "La hora de cierre debe ser posterior a la de apertura",
  })
  .nullable();

/** Horario semanal: cada dia tiene apertura y cierre, o null si no atiende (REQ-PRO-06). */
export const weeklyHoursSchema = z.object(
  Object.fromEntries(WEEK_DAYS.map((d) => [d.key, dayHoursSchema.optional()])) as Record<
    (typeof WEEK_DAYS)[number]["key"],
    z.ZodOptional<typeof dayHoursSchema>
  >,
);
export type WeeklyHours = z.infer<typeof weeklyHoursSchema>;

/** Perfil editable por el propio proveedor (REQ-PRO-01, 02, 03 y 06). */
export const providerProfileSchema = z.object({
  legalName: z.string().trim().min(3, "Razon social demasiado corta").max(160),
  rut: rutSchema,
  segment: z.enum(SERVICE_SEGMENTS),
  description: z.string().trim().max(1000, "Maximo 1.000 caracteres").default(""),
  phone: phoneSchema,
  email: z.string().trim().toLowerCase().email("Correo invalido"),
  yearsExperience: z.number().int().min(0).max(80).nullable().default(null),
  website: z
    .string()
    .trim()
    .url("URL invalida (incluye https://)")
    .max(200)
    .or(z.literal(""))
    .default(""),
  commune: z.string().trim().min(2, "Selecciona una comuna").max(80),
  address: z.string().trim().max(200).default(""),
  coverageRadiusKm: z.number().int().min(1, "Minimo 1 km").max(100, "Maximo 100 km"),
  isAvailable: z.boolean().default(true),
  weeklyHours: weeklyHoursSchema.default({}),
  modalities: z.array(z.string().trim().min(2).max(40)).max(10).default([]),
  services: z
    .array(providerServiceSchema)
    .min(1, "Elige al menos un servicio")
    .max(50)
    .refine((list) => new Set(list.map((s) => s.serviceId)).size === list.length, {
      message: "Servicio repetido",
    }),
});
export type ProviderProfileInput = z.infer<typeof providerProfileSchema>;

/** Envio a verificacion: documentos declarados por el proveedor (version simple, sin archivos). */
export const verificationRequestSchema = z.object({
  documents: z
    .array(z.string().trim().min(3).max(120))
    .min(1, "Declara al menos un documento")
    .max(10),
});
export type VerificationRequestInput = z.infer<typeof verificationRequestSchema>;

export const verificationDecisionSchema = z
  .object({
    // UUID en Supabase; en modo demo los ids son tipo "p-clima-andes".
    providerId: z.string().trim().min(3).max(100),
    decision: z.enum(["verificado", "rechazado", "en_revision"]),
    note: z.string().trim().max(500).optional(),
  })
  .refine((v) => v.decision !== "rechazado" || Boolean(v.note && v.note.length >= 5), {
    path: ["note"],
    message: "El motivo es obligatorio al rechazar",
  });
export type VerificationDecisionInput = z.infer<typeof verificationDecisionSchema>;
