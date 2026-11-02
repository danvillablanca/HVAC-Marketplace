import { useState } from "react";
import type { EquipmentType, UrgencyLevel } from "@hvac/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateServiceRequest } from "./hooks";

const EQUIPMENT_OPTIONS: { value: EquipmentType; label: string }[] = [
  { value: "split", label: "Split" },
  { value: "ducto", label: "Ducto" },
  { value: "chiller", label: "Chiller" },
  { value: "vrf", label: "VRF" },
  { value: "camara_frio", label: "Cámara de frío" },
  { value: "otro", label: "Otro" },
];

const URGENCY_OPTIONS: { value: UrgencyLevel; label: string }[] = [
  { value: "baja", label: "Baja - Sin apuro" },
  { value: "media", label: "Media - Esta semana" },
  { value: "alta", label: "Alta - Lo antes posible" },
  { value: "urgente", label: "Urgente - Hoy" },
];

interface RequestFormProps {
  onSuccess?: (id: string) => void;
  defaultServiceId?: string;
}

export function RequestForm({ onSuccess, defaultServiceId }: RequestFormProps) {
  const [equipment, setEquipment] = useState<EquipmentType>("split");
  const [urgency, setUrgency] = useState<UrgencyLevel>("media");
  const [description, setDescription] = useState("");
  const [commune, setCommune] = useState("");
  const [region, setRegion] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createRequest = useCreateServiceRequest();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (description.trim().length < 20) {
      setError("La descripción debe tener al menos 20 caracteres.");
      return;
    }

    try {
      const result = await createRequest.mutateAsync({
        serviceId: defaultServiceId,
        equipment,
        description: description.trim(),
        urgency,
        commune: commune.trim() || undefined,
        region: region.trim() || undefined,
        photos: [],
      });
      onSuccess?.(result.id);
    } catch (err: any) {
      setError(err.message ?? "Error al crear la solicitud.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nueva solicitud de servicio</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="equipment">Tipo de equipo</Label>
              <Select
                id="equipment"
                value={equipment}
                onChange={(e) => setEquipment(e.target.value as EquipmentType)}
              >
                {EQUIPMENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="urgency">Urgencia</Label>
              <Select
                id="urgency"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
              >
                {URGENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción del problema o servicio requerido</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el problema o servicio que necesitas (mínimo 20 caracteres)..."
              rows={4}
              required
              minLength={20}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">{description.length}/1000 caracteres</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="commune">Comuna</Label>
              <Input
                id="commune"
                value={commune}
                onChange={(e) => setCommune(e.target.value)}
                placeholder="Ej: Las Condes"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Región</Label>
              <Input
                id="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="Ej: Metropolitana"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={createRequest.isPending}>
            {createRequest.isPending ? "Enviando..." : "Enviar solicitud"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
