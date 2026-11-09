import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { COMMUNES, type UrgencyLevel } from "@hvac/shared";
import { useAuth } from "@/features/auth";
import { useCreateServiceRequest } from "@/features/requests/hooks";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface LeadFormProps {
  providerId: string;
  providerName?: string;
  className?: string;
}

const REGIONS = [...new Set(COMMUNES.map((c) => c.region))];

/**
 * Solicitud directa a una empresa (desde su perfil). Crea una solicitud de servicio
 * dirigida solo a este proveedor: le llega a su bandeja y responde con una cotizacion.
 */
export function LeadForm({ providerId, providerName, className }: LeadFormProps) {
  const { user } = useAuth();
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<UrgencyLevel>("media");
  const [commune, setCommune] = useState("");
  const create = useCreateServiceRequest();
  const valid = description.trim().length >= 20 && commune !== "";

  if (!user || user.role !== "cliente") {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        {user
          ? "Solo las cuentas de cliente pueden pedir cotizaciones."
          : "Para pedir una cotización a esta empresa, "}
        {!user && (
          <>
            <Link to="/ingresar" className="font-medium text-primary hover:underline">
              ingresa
            </Link>{" "}
            o{" "}
            <Link to="/registro" className="font-medium text-primary hover:underline">
              crea una cuenta de cliente
            </Link>
            .
          </>
        )}
      </p>
    );
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!valid) return;
    create.mutate({
      targetProviderId: providerId,
      equipment: "otro",
      description: description.trim(),
      urgency,
      commune,
      photos: [],
    });
  };

  if (create.isSuccess) {
    return (
      <div
        role="status"
        className={cn(
          "rounded-lg border border-success/30 bg-success/10 px-4 py-5 text-sm text-foreground",
          className,
        )}
      >
        <p className="flex items-center gap-2 font-semibold text-success">
          <CheckCircle2 className="size-4" aria-hidden />
          Solicitud enviada
        </p>
        <p className="mt-1 text-muted-foreground">
          {providerName ?? "La empresa"} recibió tu solicitud y te responderá con una cotización.{" "}
          <Link
            to={`/panel/solicitudes/${create.data.id}`}
            className="font-medium text-primary hover:underline"
          >
            Ver mi solicitud
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-3", className)}>
      <div>
        <Label htmlFor={`lead-description-${providerId}`}>Describe tu requerimiento</Label>
        <Textarea
          id={`lead-description-${providerId}`}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          minLength={20}
          maxLength={1000}
          required
          placeholder="Equipo, metraje, qué falla o qué necesitas (mínimo 20 caracteres)..."
          className="mt-1.5"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={`lead-urgency-${providerId}`}>Urgencia</Label>
          <Select
            id={`lead-urgency-${providerId}`}
            value={urgency}
            onChange={(event) => setUrgency(event.target.value as UrgencyLevel)}
            className="mt-1.5"
          >
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
            <option value="urgente">Urgente</option>
          </Select>
        </div>
        <div>
          <Label htmlFor={`lead-commune-${providerId}`}>Comuna</Label>
          <Select
            id={`lead-commune-${providerId}`}
            value={commune}
            onChange={(event) => setCommune(event.target.value)}
            className="mt-1.5"
          >
            <option value="">Selecciona tu comuna</option>
            {REGIONS.map((region) => (
              <optgroup key={region} label={region}>
                {COMMUNES.filter((c) => c.region === region).map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </div>
      </div>

      {create.isError && (
        <p className="text-sm text-destructive" role="alert">
          {create.error instanceof Error
            ? create.error.message
            : "No pudimos enviar la solicitud. Intenta nuevamente."}
        </p>
      )}

      <Button type="submit" disabled={!valid || create.isPending}>
        {create.isPending && <Loader2 className="size-4 animate-spin" />}
        Enviar solicitud a {providerName ?? "esta empresa"}
      </Button>
    </form>
  );
}
