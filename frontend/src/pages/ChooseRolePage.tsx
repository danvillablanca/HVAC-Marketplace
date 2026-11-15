import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { Button } from "@/components/ui/button";

const OPTIONS = [
  {
    role: "cliente" as const,
    title: "Busco servicios HVAC",
    body: "Publica solicitudes, compara cotizaciones y contrata proveedores verificados.",
    panel: "/panel/solicitudes",
  },
  {
    role: "proveedor" as const,
    title: "Ofrezco servicios HVAC",
    body: "Recibe solicitudes cercanas y cotiza. Tu perfil se publica tras la verificación.",
    panel: "/panel/proveedor",
  },
];

/** REQ-AUT-06: eleccion de rol en el primer ingreso con Google. */
export default function ChooseRolePage() {
  const { user, loading, chooseRole } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  if (!loading && !user) return <Navigate to="/ingresar" replace />;
  if (user && !user.needsRole) return <Navigate to="/" replace />;

  async function pick(option: (typeof OPTIONS)[number]) {
    setError(null);
    setPending(option.role);
    try {
      await chooseRole(option.role);
      navigate(option.panel, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrio un error inesperado.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">¿Cómo usarás HVAC Connect?</h1>
        <p className="mt-2 text-muted-foreground">Esta elección no se puede cambiar después.</p>
        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {OPTIONS.map((option) => (
            <div
              key={option.role}
              className="rounded-xl border border-border bg-card p-6 text-left"
            >
              <h2 className="font-semibold">{option.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{option.body}</p>
              <Button
                className="mt-4 w-full"
                disabled={pending !== null}
                onClick={() => pick(option)}
              >
                {pending === option.role ? "Guardando..." : `Soy ${option.role}`}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
