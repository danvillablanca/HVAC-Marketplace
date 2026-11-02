import { useState } from "react";
import { LocateFixed } from "lucide-react";
import {
  COMMUNES,
  SERVICE_CATALOG,
  serviceRequestCreateSchema,
  type EquipmentType,
  type UrgencyLevel,
} from "@hvac/shared";
import { Button } from "@/components/ui/button";
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

const REGIONS = [...new Set(COMMUNES.map((c) => c.region))];

/** Comuna del catalogo mas cercana a un punto (para la geolocalizacion). */
function nearestCommune(lat: number, lng: number) {
  let best = COMMUNES[0];
  let bestDist = Infinity;
  for (const c of COMMUNES) {
    const d = (c.lat - lat) ** 2 + ((c.lng - lng) * Math.cos((lat * Math.PI) / 180)) ** 2;
    if (d < bestDist) {
      best = c;
      bestDist = d;
    }
  }
  return best;
}

interface RequestFormProps {
  onSuccess?: (id: string) => void;
  defaultServiceId?: string;
}

/** REQ-SOL-01: el cliente describe su necesidad y la ubica por comuna o geolocalizacion. */
export function RequestForm({ onSuccess, defaultServiceId }: RequestFormProps) {
  const [serviceId, setServiceId] = useState(defaultServiceId ?? "");
  const [equipment, setEquipment] = useState<EquipmentType>("split");
  const [urgency, setUrgency] = useState<UrgencyLevel>("media");
  const [description, setDescription] = useState("");
  const [commune, setCommune] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const createRequest = useCreateServiceRequest();

  function locateMe() {
    if (!("geolocation" in navigator)) {
      setError("Tu navegador no permite obtener la ubicación. Elige la comuna.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const point = { lat: position.coords.latitude, lng: position.coords.longitude };
        setCoords(point);
        setCommune(nearestCommune(point.lat, point.lng).name);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError("No pudimos obtener tu ubicación. Elige la comuna en la lista.");
      },
      { timeout: 10000 },
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = serviceRequestCreateSchema.safeParse({
      serviceId: serviceId || undefined,
      equipment,
      description,
      urgency,
      commune,
      ...(coords ?? {}),
      photos: [],
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message;
      if (next.description)
        next.description = "La descripción debe tener entre 20 y 1.000 caracteres.";
      setErrors(next);
      return;
    }
    setErrors({});
    try {
      const result = await createRequest.mutateAsync(parsed.data);
      onSuccess?.(result.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la solicitud.");
    }
  }

  const fieldError = (key: string) =>
    errors[key] ? (
      <p role="alert" className="text-sm text-destructive">
        {errors[key]}
      </p>
    ) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nueva solicitud de servicio</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="serviceId">Tipo de servicio</Label>
            <Select id="serviceId" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
              <option value="">No estoy seguro / otro</option>
              {SERVICE_CATALOG.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground">
              Elegir el servicio ayuda a que te coticen los proveedores especializados.
            </p>
          </div>

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
            <Label htmlFor="description">Descripción del problema o servicio</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el problema o servicio que necesitas (mínimo 20 caracteres)..."
              rows={4}
              maxLength={1000}
            />
            <p className="text-right text-xs text-muted-foreground">{description.length}/1.000</p>
            {fieldError("description")}
          </div>

          <div className="space-y-2">
            <Label htmlFor="commune">Comuna</Label>
            <div className="flex flex-wrap gap-2">
              <Select
                id="commune"
                className="min-w-0 flex-1"
                value={commune}
                onChange={(e) => {
                  setCommune(e.target.value);
                  setCoords(null);
                }}
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
              <Button type="button" variant="outline" onClick={locateMe} disabled={locating}>
                <LocateFixed className="size-4" />
                {locating ? "Ubicando..." : "Usar mi ubicación"}
              </Button>
            </div>
            {coords && (
              <p className="text-xs text-muted-foreground">
                Usaremos tu ubicación actual. Los proveedores solo ven la comuna y la distancia
                aproximada hasta que aceptes una cotización.
              </p>
            )}
            {fieldError("commune")}
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" disabled={createRequest.isPending} className="w-full">
            {createRequest.isPending ? "Enviando..." : "Publicar solicitud"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
