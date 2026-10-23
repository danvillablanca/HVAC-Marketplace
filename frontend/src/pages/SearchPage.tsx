import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Map as MapIcon } from "lucide-react";
import type { NearbySearchInput, ProviderSummary, ServiceSegment } from "@hvac/shared";
import { RadiusFilter, useGeolocation } from "@/features/map";
import { ProviderList, ProviderModal } from "@/features/providers";
import { useNearbyProviders } from "@/features/providers/hooks";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type SortKey = "distance" | "rating";

function sortProviders(providers: ProviderSummary[], sort: SortKey): ProviderSummary[] {
  const copy = [...providers];
  if (sort === "rating") {
    copy.sort((a, b) => (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0));
  } else {
    copy.sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity));
  }
  return copy;
}

export default function SearchPage() {
  const geo = useGeolocation();

  const [radiusKm, setRadiusKm] = useState(15);
  const [segment, setSegment] = useState<ServiceSegment | "all">("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("distance");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const searchInput = useMemo<NearbySearchInput>(
    () => ({
      lat: geo.coords.lat,
      lng: geo.coords.lng,
      radiusKm,
      limit: 50,
      offset: 0,
      ...(segment !== "all" ? { segment } : {}),
      ...(query.trim() ? { query: query.trim() } : {}),
    }),
    [geo.coords.lat, geo.coords.lng, radiusKm, segment, query],
  );

  const nearby = useNearbyProviders(searchInput);
  const providers = useMemo(() => sortProviders(nearby.data ?? [], sort), [nearby.data, sort]);

  const mapParams = new URLSearchParams();
  if (query.trim()) mapParams.set("q", query.trim());
  if (segment !== "all") mapParams.set("segment", segment);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setModalOpen(true);
  };

  return (
    <div className="container-page py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Buscar proveedores</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {geo.isFallback
              ? "Mostrando resultados cerca de Santiago. Activa tu ubicacion para ordenar por distancia."
              : "Resultados ordenados por cercania a tu ubicacion."}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to={`/mapa?${mapParams.toString()}`}>
            <MapIcon className="size-4" />
            Ver en mapa
          </Link>
        </Button>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-4">
        <RadiusFilter
          radiusKm={radiusKm}
          onRadiusChange={setRadiusKm}
          segment={segment}
          onSegmentChange={setSegment}
          query={query}
          onQueryChange={setQuery}
          onUseMyLocation={geo.request}
          locating={geo.status === "loading"}
          resultCount={providers.length}
        />
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {nearby.isLoading
            ? "Buscando..."
            : `${providers.length} ${providers.length === 1 ? "proveedor" : "proveedores"}`}
        </p>
        <div className="flex items-center gap-2">
          <Label htmlFor="sort" className="whitespace-nowrap text-sm text-muted-foreground">
            Ordenar por
          </Label>
          <Select
            id="sort"
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
            className="h-9 w-40"
          >
            <option value="distance">Distancia</option>
            <option value="rating">Mejor calificados</option>
          </Select>
        </div>
      </div>

      <div className="mt-4">
        <ProviderList
          providers={providers}
          loading={nearby.isLoading}
          selectedId={selectedId}
          onSelect={handleSelect}
          emptyMessage="Prueba ampliar el radio, cambiar de segmento o ajustar tu busqueda."
        />
      </div>

      <ProviderModal providerId={selectedId} open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
