import { useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ChevronUp, List, LocateFixed, Map as MapIcon, MapPin } from "lucide-react";
import {
  SERVICE_SEGMENTS,
  type GeoPoint,
  type NearbySearchInput,
  type ServiceSegment,
} from "@hvac/shared";
import { MapView, RadiusFilter, useGeolocation } from "@/features/map";
import { ProviderList, ProviderModal } from "@/features/providers";
import { useNearbyProviders } from "@/features/providers/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEMO_PROVIDERS } from "@/data/providers";
import { cn } from "@/lib/utils";

type MobileView = "map" | "list";

function normalizeSegment(value: string | null): ServiceSegment | "all" {
  return value && (SERVICE_SEGMENTS as readonly string[]).includes(value)
    ? (value as ServiceSegment)
    : "all";
}

function findCenter(query: string): GeoPoint | null {
  const term = query.trim().toLowerCase();
  if (!term) return null;
  const match = DEMO_PROVIDERS.find((provider) =>
    [provider.commune, provider.city, provider.address, provider.legalName].some((field) =>
      field ? field.toLowerCase().includes(term) : false,
    ),
  );
  return match?.location ?? null;
}

export default function MapPage() {
  const [searchParams] = useSearchParams();
  const geo = useGeolocation();

  const [radiusKm, setRadiusKm] = useState(15);
  const [segment, setSegment] = useState<ServiceSegment | "all">(() =>
    normalizeSegment(searchParams.get("segment")),
  );
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [manualQuery, setManualQuery] = useState("");
  const [centerOverride, setCenterOverride] = useState<GeoPoint | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<MobileView>("map");
  const [modalOpen, setModalOpen] = useState(false);

  const center = centerOverride ?? geo.coords;

  const searchInput = useMemo<NearbySearchInput>(
    () => ({
      lat: center.lat,
      lng: center.lng,
      radiusKm,
      limit: 50,
      offset: 0,
      ...(segment !== "all" ? { segment } : {}),
      ...(query.trim() ? { query: query.trim() } : {}),
    }),
    [center.lat, center.lng, radiusKm, segment, query],
  );

  const nearby = useNearbyProviders(searchInput);
  const providers = nearby.data ?? [];

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setModalOpen(true);
  };

  const handleUseLocation = () => {
    setCenterOverride(null);
    geo.request();
  };

  const handleManualSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = manualQuery.trim();
    if (!term) return;
    setQuery(term);
    const nextCenter = findCenter(term);
    if (nextCenter) setCenterOverride(nextCenter);
  };

  const locationNotice = geo.status === "denied" && (
    <form
      onSubmit={handleManualSearch}
      className="flex flex-col gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3"
    >
      <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        <LocateFixed className="size-3.5 text-warning" aria-hidden />
        {geo.error ?? "Activa tu ubicacion o busca por comuna/ciudad."}
      </p>
      <div className="flex gap-2">
        <Input
          value={manualQuery}
          onChange={(event) => setManualQuery(event.target.value)}
          placeholder="Comuna o ciudad (ej: Nunoa)"
          aria-label="Comuna o ciudad"
          className="h-9"
        />
        <Button type="submit" size="sm" variant="outline">
          Buscar
        </Button>
      </div>
    </form>
  );

  const filterProps = {
    radiusKm,
    onRadiusChange: setRadiusKm,
    segment,
    onSegmentChange: setSegment,
    query,
    onQueryChange: setQuery,
    onUseMyLocation: handleUseLocation,
    locating: geo.status === "loading",
    resultCount: providers.length,
  };

  const list = (
    <ProviderList
      providers={providers}
      loading={nearby.isLoading}
      selectedId={selectedId}
      onHover={setHoveredId}
      onSelect={handleSelect}
      emptyMessage={
        geo.isFallback
          ? "Prueba ampliar el radio, cambiar de segmento o buscar por comuna."
          : "No hay proveedores en este radio. Amplia la distancia o cambia de segmento."
      }
    />
  );

  return (
    <div className="relative flex h-[calc(100dvh-4rem)] flex-col md:grid md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="relative min-h-0 flex-1 md:h-full">
        <MapView
          providers={providers}
          center={center}
          radiusKm={radiusKm}
          selectedId={selectedId}
          hoveredId={hoveredId}
          onSelectProvider={handleSelect}
          onHoverProvider={setHoveredId}
          onMoveEnd={setCenterOverride}
          className="h-full"
        />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-3 md:hidden">
          <div className="pointer-events-auto rounded-xl border border-border bg-card/95 p-3 shadow-md backdrop-blur">
            <div className="mb-3 grid grid-cols-2 gap-1 rounded-lg bg-secondary p-1">
              <button
                type="button"
                onClick={() => setMobileView("map")}
                aria-pressed={mobileView === "map"}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  mobileView === "map"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground",
                )}
              >
                <MapIcon className="size-4" /> Mapa
              </button>
              <button
                type="button"
                onClick={() => setMobileView("list")}
                aria-pressed={mobileView === "list"}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  mobileView === "list"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground",
                )}
              >
                <List className="size-4" /> Lista
              </button>
            </div>
            <RadiusFilter {...filterProps} />
            {locationNotice && <div className="mt-3">{locationNotice}</div>}
          </div>
        </div>

        {mobileView === "map" && (
          <div className="absolute inset-x-0 bottom-0 z-20 p-3 md:hidden">
            <div className="rounded-t-xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur">
              <button
                type="button"
                onClick={() => setMobileView("list")}
                className="flex w-full items-center justify-between gap-3"
                aria-label="Expandir listado de proveedores"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <MapPin className="size-4 text-primary" aria-hidden />
                  {providers.length} {providers.length === 1 ? "proveedor" : "proveedores"} cerca
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Ver listado <ChevronUp className="size-4" aria-hidden />
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      <aside className="hidden h-full min-h-0 flex-col gap-4 overflow-y-auto border-l border-border bg-background p-4 md:flex">
        <RadiusFilter {...filterProps} />
        {locationNotice}
        {list}
      </aside>

      <AnimatePresence>
        {mobileView === "list" && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-30 flex flex-col bg-background md:hidden"
          >
            <div className="border-b border-border p-3">
              <div className="mb-3 grid grid-cols-2 gap-1 rounded-lg bg-secondary p-1">
                <button
                  type="button"
                  onClick={() => setMobileView("map")}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground"
                >
                  <MapIcon className="size-4" /> Mapa
                </button>
                <button
                  type="button"
                  onClick={() => setMobileView("list")}
                  aria-pressed
                  className="inline-flex items-center justify-center gap-1.5 rounded-md bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-sm"
                >
                  <List className="size-4" /> Lista
                </button>
              </div>
              <RadiusFilter {...filterProps} />
              <div className="mt-3">{locationNotice}</div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">{list}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <ProviderModal providerId={selectedId} open={modalOpen} onOpenChange={setModalOpen} />

      <p className="sr-only" aria-live="polite">
        {nearby.isLoading
          ? "Buscando proveedores cercanos"
          : `${providers.length} proveedores encontrados`}
      </p>
    </div>
  );
}
