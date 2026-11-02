import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Map as MapIcon, MapPin } from "lucide-react";
import {
  COMMUNES,
  SERVICE_CATALOG,
  findCommune,
  type NearbySearchParams,
  type ServiceSegment,
} from "@hvac/shared";
import { RadiusFilter, useGeolocation } from "@/features/map";
import { ProviderList, ProviderModal } from "@/features/providers";
import { useNearbyProviders } from "@/features/providers/hooks";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type SortKey = "distance" | "rating";

/** BUS-03: resultados por pagina. */
const PAGE_SIZE = 10;
const REGIONS = [...new Set(COMMUNES.map((c) => c.region))];
const RATING_OPTIONS = [
  { value: "", label: "Cualquiera" },
  { value: "3", label: "3+ estrellas" },
  { value: "4", label: "4+ estrellas" },
  { value: "4.5", label: "4,5+ estrellas" },
];

export default function SearchPage() {
  const geo = useGeolocation();

  // BUS-02: radio por defecto de 10 km.
  const [radiusKm, setRadiusKm] = useState(10);
  const [segment, setSegment] = useState<ServiceSegment | "all">("all");
  const [query, setQuery] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [minRating, setMinRating] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sort, setSort] = useState<SortKey>("distance");
  const [page, setPage] = useState(0);
  // BUS-01: si no hay geolocalizacion, el usuario elige region y comuna (centroide).
  const [region, setRegion] = useState("Metropolitana de Santiago");
  const [communeName, setCommuneName] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const commune = communeName ? findCommune(communeName) : undefined;
  const origin = commune ?? geo.coords;
  const usingCommune = Boolean(commune);

  const filtersKey = [
    origin.lat,
    origin.lng,
    radiusKm,
    segment,
    query,
    serviceId,
    minRating,
    onlyAvailable,
    sort,
  ].join("|");
  useEffect(() => setPage(0), [filtersKey]);

  const searchInput = useMemo<NearbySearchParams>(
    () => ({
      lat: origin.lat,
      lng: origin.lng,
      radiusKm,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      sort,
      onlyAvailable,
      ...(segment !== "all" ? { segment } : {}),
      ...(query.trim() ? { query: query.trim() } : {}),
      ...(serviceId ? { serviceId } : {}),
      ...(minRating ? { minRating: Number(minRating) } : {}),
    }),
    [
      origin.lat,
      origin.lng,
      radiusKm,
      page,
      sort,
      onlyAvailable,
      segment,
      query,
      serviceId,
      minRating,
    ],
  );

  const nearby = useNearbyProviders(searchInput);
  const providers = nearby.data?.items ?? [];
  const total = nearby.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min(total, (page + 1) * PAGE_SIZE);

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
            {usingCommune
              ? `Resultados cerca de ${commune!.name}.`
              : geo.isFallback
                ? "Mostrando resultados cerca de Santiago. Activa tu ubicación o elige tu comuna."
                : "Resultados ordenados por cercanía a tu ubicación."}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to={`/mapa?${mapParams.toString()}`}>
            <MapIcon className="size-4" />
            Ver en mapa
          </Link>
        </Button>
      </div>

      <div className="mt-6 space-y-4 rounded-xl border border-border bg-card p-4">
        <RadiusFilter
          radiusKm={radiusKm}
          onRadiusChange={setRadiusKm}
          segment={segment}
          onSegmentChange={setSegment}
          query={query}
          onQueryChange={setQuery}
          onUseMyLocation={() => {
            setCommuneName("");
            geo.request();
          }}
          locating={geo.status === "loading"}
          resultCount={total}
        />

        <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="search-region">Región</Label>
            <Select
              id="search-region"
              value={region}
              onChange={(e) => {
                setRegion(e.target.value);
                setCommuneName("");
              }}
            >
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="search-commune">Comuna</Label>
            <Select
              id="search-commune"
              value={communeName}
              onChange={(e) => setCommuneName(e.target.value)}
            >
              <option value="">{geo.isFallback ? "Centro de Santiago" : "Mi ubicación"}</option>
              {COMMUNES.filter((c) => c.region === region).map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="search-service">Servicio</Label>
            <Select
              id="search-service"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
            >
              <option value="">Todos</option>
              {SERVICE_CATALOG.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="search-rating">Calificación mínima</Label>
            <Select
              id="search-rating"
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
            >
              {RATING_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            checked={onlyAvailable}
            onChange={(e) => setOnlyAvailable(e.target.checked)}
          />
          Solo proveedores disponibles para nuevos trabajos
        </label>
        {geo.error && !usingCommune && (
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-4" /> {geo.error}
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {nearby.isLoading
            ? "Buscando..."
            : total === 0
              ? "0 proveedores"
              : `Mostrando ${from}–${to} de ${total} ${total === 1 ? "proveedor" : "proveedores"}`}
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
          emptyMessage="Prueba ampliar el radio, elegir otra comuna o quitar filtros."
        />
      </div>

      {pages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-3" aria-label="Paginación">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="size-4" /> Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page + 1} de {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page + 1 >= pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente <ChevronRight className="size-4" />
          </Button>
        </nav>
      )}

      <ProviderModal providerId={selectedId} open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
