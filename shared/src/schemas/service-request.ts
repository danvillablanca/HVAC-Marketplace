import { z } from "zod";

export const serviceRequestCreateSchema = z.object({
  serviceId: z.string().uuid().optional(),
  equipment: z.enum(["split", "ducto", "chiller", "vrf", "camara_frio", "otro"]).default("otro"),
  description: z.string().trim().min(20).max(1000),
  urgency: z.enum(["baja", "media", "alta", "urgente"]).default("media"),
  commune: z.string().trim().min(2, "Selecciona una comuna").max(100),
  region: z.string().trim().max(100).optional(),
  address: z.string().trim().max(300).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  photos: z.array(z.string().url()).max(5).default([]),
  /** Solicitud directa a una empresa (desde su perfil). Sin valor: va a todos los elegibles. */
  targetProviderId: z.string().trim().min(3).max(100).optional(),
});
export type ServiceRequestCreateInput = z.infer<typeof serviceRequestCreateSchema>;

/** SOL-04: transiciones que un usuario puede pedir (las demas las fija el sistema). */
export const serviceRequestUpdateSchema = z.object({
  status: z.enum(["en_ejecucion", "completada", "cancelada"]),
  note: z.string().trim().max(500).optional(),
});
export type ServiceRequestUpdateInput = z.infer<typeof serviceRequestUpdateSchema>;

export const quoteCreateSchema = z.object({
  requestId: z.string().uuid(),
  amount: z.number().int().positive(),
  includesIva: z.boolean().default(true),
  scope: z.string().trim().min(20).max(2000),
  deadlineDays: z.number().int().positive(),
  validDays: z.number().int().min(1).max(30).default(15),
});
export type QuoteCreateInput = z.infer<typeof quoteCreateSchema>;

export const quoteAcceptSchema = z.object({
  quoteId: z.string().uuid(),
});

/** COT-02: el cliente acepta o rechaza una cotizacion. */
export const quoteDecisionSchema = z.object({
  action: z.enum(["aceptar", "rechazar"]).default("aceptar"),
});
export type QuoteDecisionInput = z.infer<typeof quoteDecisionSchema>;
export type QuoteAcceptInput = z.infer<typeof quoteAcceptSchema>;

/** MSG-01: mensaje en un hilo. El cliente indica el proveedor; el proveedor usa el suyo. */
export const messageCreateSchema = z.object({
  providerId: z.string().trim().min(3).max(100).optional(),
  body: z.string().trim().min(1, "Escribe un mensaje").max(2000, "Maximo 2.000 caracteres"),
});
export type MessageCreateInput = z.infer<typeof messageCreateSchema>;

