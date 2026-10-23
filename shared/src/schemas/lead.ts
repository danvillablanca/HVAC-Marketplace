import { z } from "zod";

export const leadCreateSchema = z.object({
  providerId: z.string().uuid(),
  serviceId: z.string().uuid().nullable().optional(),
  description: z.string().trim().min(10, "Describe tu requerimiento").max(2000),
  urgency: z.enum(["baja", "media", "alta"]).default("media"),
  preferredContact: z.enum(["telefono", "whatsapp", "correo"]).default("whatsapp"),
});
export type LeadCreateInput = z.infer<typeof leadCreateSchema>;

export const leadUpdateSchema = z.object({
  status: z.enum(["nuevo", "contactado", "cotizado", "cerrado", "perdido"]),
  note: z.string().trim().max(500).optional(),
});
export type LeadUpdateInput = z.infer<typeof leadUpdateSchema>;
