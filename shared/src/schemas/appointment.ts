import { z } from "zod";

export const appointmentCreateSchema = z.object({
  leadId: z.string().uuid(),
  startsAt: z.string().datetime({ offset: true }),
  durationMinutes: z.number().int().min(30).max(480).default(90),
});
export type AppointmentCreateInput = z.infer<typeof appointmentCreateSchema>;

export const appointmentUpdateSchema = z.object({
  status: z.enum(["propuesta", "confirmada", "realizada", "cancelada"]),
});
export type AppointmentUpdateInput = z.infer<typeof appointmentUpdateSchema>;
