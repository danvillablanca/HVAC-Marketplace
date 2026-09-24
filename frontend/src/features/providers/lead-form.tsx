import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { LeadCreateInput } from "@hvac/shared";
import { useCreateLead } from "@/features/providers/hooks";
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

/** Formulario de solicitud de cotizacion/contacto (crea un lead). */
export function LeadForm({ providerId, providerName, className }: LeadFormProps) {
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<LeadCreateInput["urgency"]>("media");
  const [preferredContact, setPreferredContact] =
    useState<LeadCreateInput["preferredContact"]>("whatsapp");
  const createLead = useCreateLead();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (description.trim().length < 10) return;
    createLead.mutate({ providerId, description: description.trim(), urgency, preferredContact });
  };

  if (createLead.isSuccess) {
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
          {providerName ? `${providerName} te` : "Te"} contactara pronto por {preferredContact}.
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
          minLength={10}
          maxLength={2000}
          required
          placeholder="Equipo, metraje, urgencia, comuna..."
          className="mt-1.5"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={`lead-urgency-${providerId}`}>Urgencia</Label>
          <Select
            id={`lead-urgency-${providerId}`}
            value={urgency}
            onChange={(event) => setUrgency(event.target.value as LeadCreateInput["urgency"])}
            className="mt-1.5"
          >
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </Select>
        </div>
        <div>
          <Label htmlFor={`lead-contact-${providerId}`}>Contacto preferido</Label>
          <Select
            id={`lead-contact-${providerId}`}
            value={preferredContact}
            onChange={(event) =>
              setPreferredContact(event.target.value as LeadCreateInput["preferredContact"])
            }
            className="mt-1.5"
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="telefono">Telefono</option>
            <option value="correo">Correo</option>
          </Select>
        </div>
      </div>

      {createLead.isError && (
        <p className="text-sm text-destructive" role="alert">
          No pudimos enviar la solicitud. Intenta nuevamente.
        </p>
      )}

      <Button type="submit" disabled={description.trim().length < 10 || createLead.isPending}>
        {createLead.isPending && <Loader2 className="size-4 animate-spin" />}
        Enviar solicitud
      </Button>
    </form>
  );
}
