import { useId } from "react";
import { LocateFixed, Loader2, Search } from "lucide-react";
import { SERVICE_SEGMENTS, type ServiceSegment } from "@hvac/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const SEGMENT_LABELS: Record<ServiceSegment, string> = {
  residencial: "Residencial",
  comercial: "Comercial",
  industrial: "Industrial",
};

export interface RadiusFilterProps {
  radiusKm: number;
  onRadiusChange: (value: number) => void;
  segment: ServiceSegment | "all";
  onSegmentChange: (value: ServiceSegment | "all") => void;
  query: string;
  onQueryChange: (value: string) => void;
  onUseMyLocation?: () => void;
  locating?: boolean;
  resultCount?: number;
  className?: string;
}

/** Filtros de busqueda: texto, segmento, radio y ubicacion. */
export function RadiusFilter({
  radiusKm,
  onRadiusChange,
  segment,
  onSegmentChange,
  query,
  onQueryChange,
  onUseMyLocation,
  locating = false,
  resultCount,
  className,
}: RadiusFilterProps) {
  const fieldId = useId();

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label htmlFor={`${fieldId}-search`}>Buscar servicio o proveedor</Label>
          <div className="relative mt-1.5">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id={`${fieldId}-search`}
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Aire acondicionado, split, sala limpia..."
              className="pl-9"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="sm:w-44">
          <Label htmlFor={`${fieldId}-segment`}>Segmento</Label>
          <Select
            id={`${fieldId}-segment`}
            value={segment}
            onChange={(event) => onSegmentChange(event.target.value as ServiceSegment | "all")}
            className="mt-1.5"
          >
            <option value="all">Todos</option>
            {SERVICE_SEGMENTS.map((value) => (
              <option key={value} value={value}>
                {SEGMENT_LABELS[value]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <Label htmlFor={`${fieldId}-radius`}>Radio de busqueda</Label>
            <span className="text-sm font-medium tabular-nums text-primary">{radiusKm} km</span>
          </div>
          <input
            id={`${fieldId}-radius`}
            type="range"
            min={1}
            max={50}
            step={1}
            value={radiusKm}
            onChange={(event) => onRadiusChange(Number(event.target.value))}
            aria-label="Radio de busqueda en kilometros"
            className="mt-2 w-full cursor-pointer accent-primary"
          />
        </div>

        <div className="flex items-center gap-3">
          {resultCount !== undefined && (
            <span className="whitespace-nowrap text-sm text-muted-foreground">
              {resultCount} {resultCount === 1 ? "resultado" : "resultados"}
            </span>
          )}
          {onUseMyLocation && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onUseMyLocation}
              disabled={locating}
            >
              {locating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LocateFixed className="size-4" />
              )}
              Usar mi ubicacion
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
