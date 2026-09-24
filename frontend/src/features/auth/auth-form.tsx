import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import {
  formatRut,
  isValidRut,
  loginSchema,
  registerSchema,
  type RegisterInput,
  type UserRole,
} from "@hvac/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "./auth-context";

type AuthMode = "login" | "register";

interface AuthFormProps {
  mode: AuthMode;
  /** Destino tras autenticarse; si no se indica, se usa el panel segun el rol. */
  redirectTo?: string;
  className?: string;
}

const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: "cliente", label: "Cliente (busco servicios HVAC)" },
  { value: "proveedor", label: "Proveedor (ofrezco servicios HVAC)" },
];

const PANEL_BY_ROLE: Record<UserRole, string> = {
  cliente: "/panel/solicitudes",
  proveedor: "/panel/proveedor",
  admin: "/panel/admin/verificaciones",
};

interface FormValues {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  rut: string;
  phone: string;
}

const INITIAL_VALUES: FormValues = {
  email: "",
  password: "",
  fullName: "",
  role: "cliente",
  rut: "",
  phone: "",
};

/** Esquema de validacion segun el modo; exige RUT/telefono cuando el rol es proveedor. */
const registerWithRole = registerSchema.superRefine((value, ctx) => {
  if (value.role !== "proveedor") return;
  if (!value.rut) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["rut"],
      message: "El RUT es obligatorio para proveedores",
    });
  } else if (!isValidRut(value.rut)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["rut"],
      message: "RUT chileno invalido",
    });
  }
  if (!value.phone) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["phone"],
      message: "El telefono es obligatorio para proveedores",
    });
  }
});

export function AuthForm({ mode, redirectTo, className }: AuthFormProps) {
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    if (!authenticated || !user) return;
    navigate(redirectTo ?? PANEL_BY_ROLE[user.role], { replace: true });
  }, [authenticated, user, redirectTo, navigate]);

  function update<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function applyFieldErrors(fieldErrors: Record<string, string[] | undefined>) {
    const next: Record<string, string> = {};
    for (const [field, messages] of Object.entries(fieldErrors)) {
      if (messages && messages.length > 0) next[field] = messages[0];
    }
    setErrors(next);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (mode === "login") {
      const parsed = loginSchema.safeParse({ email: values.email, password: values.password });
      if (!parsed.success) {
        applyFieldErrors(parsed.error.flatten().fieldErrors);
        return;
      }
      setErrors({});
      setSubmitting(true);
      try {
        await signIn(parsed.data.email, parsed.data.password);
        setAuthenticated(true);
      } catch (error) {
        setFormError(error instanceof Error ? error.message : "Ocurrio un error inesperado.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const payload = {
      email: values.email,
      password: values.password,
      fullName: values.fullName,
      role: values.role,
      ...(values.role === "proveedor" ? { rut: values.rut, phone: values.phone } : {}),
    };
    const parsed = registerWithRole.safeParse(payload);
    if (!parsed.success) {
      applyFieldErrors(parsed.error.flatten().fieldErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await signUp(parsed.data as RegisterInput);
      setAuthenticated(true);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Ocurrio un error inesperado.");
    } finally {
      setSubmitting(false);
    }
  }

  const isRegister = mode === "register";

  return (
    <form onSubmit={handleSubmit} noValidate className={cn("space-y-5", className)}>
      {formError && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {formError}
        </div>
      )}

      {isRegister && (
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Nombre completo</Label>
          <Input
            id="fullName"
            name="fullName"
            autoComplete="name"
            value={values.fullName}
            onChange={(event) => update("fullName", event.target.value)}
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? "fullName-error" : undefined}
            placeholder="Maria Gonzalez"
          />
          {errors.fullName && (
            <p
              id="fullName-error"
              role="alert"
              aria-live="polite"
              className="text-sm text-destructive"
            >
              {errors.fullName}
            </p>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="email">Correo electronico</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(event) => update("email", event.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          placeholder="tucorreo@dominio.cl"
        />
        {errors.email && (
          <p id="email-error" role="alert" aria-live="polite" className="text-sm text-destructive">
            {errors.email}
          </p>
        )}
      </div>

      {isRegister && (
        <div className="space-y-1.5">
          <Label htmlFor="role">Tipo de cuenta</Label>
          <Select
            id="role"
            name="role"
            value={values.role}
            onChange={(event) => update("role", event.target.value as UserRole)}
            aria-describedby="role-help"
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <p id="role-help" className="text-xs text-muted-foreground">
            Los proveedores pasan por una verificacion ASHRAE antes de publicar su perfil.
          </p>
        </div>
      )}

      {isRegister && values.role === "proveedor" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="rut">RUT de la empresa</Label>
            <Input
              id="rut"
              name="rut"
              inputMode="text"
              value={values.rut}
              onChange={(event) => update("rut", event.target.value)}
              onBlur={(event) => {
                if (event.target.value.trim()) update("rut", formatRut(event.target.value));
              }}
              aria-invalid={Boolean(errors.rut)}
              aria-describedby={errors.rut ? "rut-error" : "rut-help"}
              placeholder="76.543.210-K"
            />
            {errors.rut ? (
              <p
                id="rut-error"
                role="alert"
                aria-live="polite"
                className="text-sm text-destructive"
              >
                {errors.rut}
              </p>
            ) : (
              <p id="rut-help" className="text-xs text-muted-foreground">
                Se valida con modulo 11 (formato chileno).
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefono</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={values.phone}
              onChange={(event) => update("phone", event.target.value)}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? "phone-error" : "phone-help"}
              placeholder="+56 9 1234 5678"
            />
            {errors.phone ? (
              <p
                id="phone-error"
                role="alert"
                aria-live="polite"
                className="text-sm text-destructive"
              >
                {errors.phone}
              </p>
            ) : (
              <p id="phone-help" className="text-xs text-muted-foreground">
                Formato chileno +56 9 XXXX XXXX.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="password">Contrasena</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          value={values.password}
          onChange={(event) => update("password", event.target.value)}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "password-error" : undefined}
          placeholder={isRegister ? "Minimo 8 caracteres" : "Tu contrasena"}
        />
        {errors.password && (
          <p
            id="password-error"
            role="alert"
            aria-live="polite"
            className="text-sm text-destructive"
          >
            {errors.password}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? "Procesando..." : isRegister ? "Crear cuenta" : "Ingresar"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {isRegister ? (
          <>
            Ya tienes cuenta?{" "}
            <Link to="/ingresar" className="font-medium text-primary hover:underline">
              Inicia sesion
            </Link>
          </>
        ) : (
          <>
            No tienes cuenta?{" "}
            <Link to="/registro" className="font-medium text-primary hover:underline">
              Registrate
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
