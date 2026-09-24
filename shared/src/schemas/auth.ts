import { z } from "zod";
import { USER_ROLES } from "../types/index";
import { isValidRut, normalizeRut } from "../utils/rut";
import { normalizePhone } from "../utils/format";

export const rutSchema = z
  .string()
  .trim()
  .transform(normalizeRut)
  .refine(isValidRut, { message: "RUT chileno invalido" });

export const phoneSchema = z
  .string()
  .trim()
  .min(8, "Telefono demasiado corto")
  .transform(normalizePhone)
  .refine((v) => /^\+56\d{9}$/.test(v), { message: "Telefono debe ser +56 9 XXXX XXXX" });

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Correo invalido"),
  password: z.string().min(8, "Minimo 8 caracteres"),
  fullName: z.string().trim().min(3, "Nombre demasiado corto"),
  role: z.enum(USER_ROLES),
  rut: rutSchema.optional(),
  phone: phoneSchema.optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Correo invalido"),
  password: z.string().min(1, "Ingresa tu contrasena"),
});
export type LoginInput = z.infer<typeof loginSchema>;
