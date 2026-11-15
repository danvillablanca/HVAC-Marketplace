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

/** Politica de contrasena compartida por registro y restablecimiento (REQ-AUT-01/03). */
export const passwordSchema = z
  .string()
  .min(8, "Minimo 8 caracteres")
  .max(72, "Maximo 72 caracteres")
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), {
    message: "Debe incluir al menos una letra y un numero",
  });

/** RN-01: el rol admin no se auto-registra. */
export const SELF_SIGNUP_ROLES = USER_ROLES.filter((role) => role !== "admin") as [
  "cliente",
  "proveedor",
];

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Correo invalido"),
  password: passwordSchema,
  fullName: z.string().trim().min(3, "Nombre demasiado corto"),
  role: z.enum(SELF_SIGNUP_ROLES),
  rut: rutSchema.optional(),
  phone: phoneSchema.optional(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: "Debes aceptar los terminos y la politica de privacidad" }),
  }),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Correo invalido"),
  password: z.string().min(1, "Ingresa tu contrasena"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const passwordResetRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email("Correo invalido"),
});

export const passwordResetSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Las contrasenas no coinciden",
  });
