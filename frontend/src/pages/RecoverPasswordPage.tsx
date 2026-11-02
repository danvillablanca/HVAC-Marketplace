import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { passwordResetRequestSchema } from "@hvac/shared";
import { useAuth } from "@/features/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** REQ-AUT-03: solicita el correo de recuperacion. */
export default function RecoverPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const parsed = passwordResetRequestSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Correo invalido");
      return;
    }
    setSubmitting(true);
    try {
      await requestPasswordReset(parsed.data.email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrio un error inesperado.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <h1 className="text-center text-2xl font-bold sm:text-3xl">Recupera tu contraseña</h1>
        <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
          {sent ? (
            <p role="status" className="text-sm">
              Si existe una cuenta con <strong>{email}</strong>, te enviamos un enlace para crear
              una nueva contraseña. Revisa tu bandeja de entrada y la carpeta de spam.
            </p>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {error && (
                <div
                  role="alert"
                  className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {error}
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Correo electronico</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="tucorreo@dominio.cl"
                />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? "Enviando..." : "Enviar enlace"}
              </Button>
            </form>
          )}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/ingresar" className="font-medium text-primary hover:underline">
              Volver a ingresar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
