import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { passwordResetSchema } from "@hvac/shared";
import { useAuth } from "@/features/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * REQ-AUT-03: el enlace del correo abre esta pagina con una sesion de
 * recuperacion; aqui se define la nueva contrasena con la misma politica.
 */
export default function ResetPasswordPage() {
  const { user, loading, updatePassword, signOut } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const parsed = passwordResetSchema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await updatePassword(parsed.data.password);
      await signOut();
      navigate("/ingresar", { replace: true, state: { passwordReset: true } });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Ocurrio un error inesperado.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <h1 className="text-center text-2xl font-bold sm:text-3xl">Crea una nueva contraseña</h1>
        <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
          {!loading && !user ? (
            <p role="alert" className="text-sm">
              El enlace no es válido o ya expiró.{" "}
              <Link to="/recuperar" className="font-medium text-primary hover:underline">
                Solicita uno nuevo
              </Link>
              .
            </p>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {formError && (
                <div
                  role="alert"
                  className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {formError}
                </div>
              )}
              {(["password", "confirm"] as const).map((field) => (
                <div key={field} className="space-y-1.5">
                  <Label htmlFor={field}>
                    {field === "password" ? "Nueva contraseña" : "Repite la contraseña"}
                  </Label>
                  <Input
                    id={field}
                    type="password"
                    autoComplete="new-password"
                    value={values[field]}
                    onChange={(event) => setValues((v) => ({ ...v, [field]: event.target.value }))}
                    aria-invalid={Boolean(errors[field])}
                    aria-describedby={errors[field] ? `${field}-error` : undefined}
                    placeholder={
                      field === "password" ? "Mínimo 8 caracteres, letras y números" : ""
                    }
                  />
                  {errors[field] && (
                    <p id={`${field}-error`} role="alert" className="text-sm text-destructive">
                      {errors[field]}
                    </p>
                  )}
                </div>
              ))}
              <Button type="submit" size="lg" className="w-full" disabled={submitting || loading}>
                {submitting ? "Guardando..." : "Guardar contraseña"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
