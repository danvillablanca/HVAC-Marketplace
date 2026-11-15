import { z } from "zod";

export const notificationMarkReadSchema = z.object({
  read: z.literal(true),
});
export type NotificationMarkReadInput = z.infer<typeof notificationMarkReadSchema>;
