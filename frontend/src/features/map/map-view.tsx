import { useCallback, useEffect, useRef } from "react";
import {
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  ScaleControl,
  type CircleLayerSpecification,
  type FillLayerSpecification,
  type FilterSpecification,
  type GeoJSONSource,
  type GeoJSONSourceSpecification,
  type LineLayerSpecification,
  type SymbolLayerSpecification,
} from "maplibre-gl";
import type { GeoPoint, ProviderSummary } from "@hvac/shared";
import { mapStyleUrl } from "@/lib/env";
import { cn } from "@/lib/utils";
import {
  buildCircle,
  initials,
  resolveCssColor,
  SEGMENT_COLORS,
  VERIFICATION_COLORS,
} from "./geo-helpers";
import "maplibre-gl/dist/maplibre-gl.css";

/**
 * `ProviderSummary` no incluye coordenadas en el tipo, pero la API/demo las
 * adjunta al resumir el detalle. Aceptamos opcionalmente `location` para pintar
 * los marcadores sin romper si algun proveedor no la trae.
 */
export type MapProvider = ProviderSummary & { location?: GeoPoint | null };

export interface MapViewProps {
  providers: MapProvider[];
  center: GeoPoint;
  radiusKm: number;
  selectedId?: string | null;
  hoveredId?: string | null;
  onSelectProvider?: (id: string) => void;
  onHoverProvider?: (id: string | null) => void;
  onMoveEnd?: (center: GeoPoint) => void;
  className?: string;
}

const RADIUS_SOURCE = "hvac-radius";
const RADIUS_FILL = "hvac-radius-fill";
const RADIUS_OUTLINE = "hvac-radius-outline";
const PROVIDERS_SOURCE = "hvac-providers";
const CLUSTER_LAYER = "hvac-clusters";
const CLUSTER_COUNT_LAYER = "hvac-cluster-count";

const HAS_COUNT: FilterSpecification = ["has", "point_count"];

function buildProviderFeatures(
  providers: MapProvider[],
  selectedId: string | null | undefined,
): GeoJSONSourceSpecification["data"] {
  const features = providers
    .filter((provider): provider is MapProvider & { location: GeoPoint } =>
      Boolean(provider.location),
    )
    .map((provider) => ({
      type: "Feature",
      id: provider.id,
      properties: {
        id: provider.id,
        name: provider.legalName,
        segment: provider.segment,
        verification: provider.verificationStatus,
        selected: provider.id === selectedId,
      },
      geometry: { type: "Point", coordinates: [provider.location.lng, provider.location.lat] },
    }));

  return {
    type: "FeatureCollection",
    features,
  } as unknown as GeoJSONSourceSpecification["data"];
}

function createMarkerElement(provider: MapProvider): HTMLButtonElement {
  const element = document.createElement("button");
  element.type = "button";
  element.setAttribute("aria-label", `Ver ficha de ${provider.legalName}`);
  // No fijamos `position` ni `transform` en el elemento raiz: MapLibre los usa
  // para posicionar el marker (clase `.maplibregl-marker`). El pin va en un hijo.
  element.style.cssText = [
    "display:block",
    "width:34px",
    "height:34px",
    "padding:0",
    "border:0",
    "background:transparent",
    "cursor:pointer",
  ].join(";");

  const pin = document.createElement("span");
  pin.style.cssText = [
    "position:absolute",
    "inset:0",
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "border-radius:9999px 9999px 9999px 3px",
    "border:2px solid transparent",
    "transform:rotate(-45deg)",
    "box-shadow:0 4px 10px rgba(0,0,0,0.28)",
    "transition:transform 150ms ease, box-shadow 150ms ease",
    "pointer-events:none",
  ].join(";");

  const inner = document.createElement("span");
  inner.textContent =
    provider.verificationStatus === "verificado" ? "✓" : initials(provider.legalName);
  inner.style.cssText =
    "transform:rotate(45deg);color:#ffffff;font-size:12px;font-weight:700;line-height:1;";
  pin.appendChild(inner);
  element.appendChild(pin);
  return element;
}

function updateMarkerElement(
  element: HTMLElement,
  provider: MapProvider,
  selected: boolean,
  hovered: boolean,
): void {
  const background = resolveCssColor(SEGMENT_COLORS[provider.segment], "#0ea5c9");
  const ring = resolveCssColor(VERIFICATION_COLORS[provider.verificationStatus], "#16a34a");
  const scale = selected ? 1.25 : hovered ? 1.12 : 1;
  const pin = element.firstElementChild as HTMLElement | null;
  if (pin) {
    pin.style.background = background;
    pin.style.borderColor = ring;
    pin.style.transform = `rotate(-45deg) scale(${scale})`;
  }
  element.style.zIndex = selected ? "20" : hovered ? "10" : "1";
}

interface MapViewState {
  providers: MapProvider[];
  center: GeoPoint;
  radiusKm: number;
  selectedId: string | null;
  hoveredId: string | null;
}

/** Mapa interactivo con MapLibre: radio, clustering y marcadores por proveedor. */
export function MapView({
  providers,
  center,
  radiusKm,
  selectedId = null,
  hoveredId = null,
  onSelectProvider,
  onHoverProvider,
  onMoveEnd,
  className,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const loadedRef = useRef(false);
  const stateRef = useRef<MapViewState>({ providers, center, radiusKm, selectedId, hoveredId });
  const selectRef = useRef(onSelectProvider);
  const hoverRef = useRef(onHoverProvider);
  const moveEndRef = useRef(onMoveEnd);

  useEffect(() => {
    stateRef.current = { providers, center, radiusKm, selectedId, hoveredId };
  }, [providers, center, radiusKm, selectedId, hoveredId]);

  useEffect(() => {
    selectRef.current = onSelectProvider;
  }, [onSelectProvider]);

  useEffect(() => {
    hoverRef.current = onHoverProvider;
  }, [onHoverProvider]);

  useEffect(() => {
    moveEndRef.current = onMoveEnd;
  }, [onMoveEnd]);

  const refreshClusterVisibility = useCallback(async () => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    const source = map.getSource(PROVIDERS_SOURCE) as GeoJSONSource | undefined;
    if (!source) return;

    let clusteredIds = new Set<string>();
    try {
      const clusters = map.querySourceFeatures(PROVIDERS_SOURCE, { filter: HAS_COUNT });
      const leaves = await Promise.all(
        clusters.map(async (cluster) => {
          const clusterId = cluster.properties?.["cluster_id"] as number | undefined;
          if (clusterId === undefined) return [];
          return source.getClusterLeaves(clusterId, 200, 0);
        }),
      );
      clusteredIds = new Set(
        leaves
          .flat()
          .map((leaf) => (leaf.properties?.["id"] as string | undefined) ?? "")
          .filter(Boolean),
      );
    } catch {
      return;
    }

    markersRef.current.forEach((marker, id) => {
      marker.getElement().style.visibility = clusteredIds.has(id) ? "hidden" : "visible";
    });
  }, []);

  const syncProviders = useCallback(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    const {
      providers: list,
      selectedId: currentSelected,
      hoveredId: currentHovered,
    } = stateRef.current;

    const source = map.getSource(PROVIDERS_SOURCE) as GeoJSONSource | undefined;
    source?.setData(buildProviderFeatures(list, currentSelected));

    const located = list.filter((provider): provider is MapProvider & { location: GeoPoint } =>
      Boolean(provider.location),
    );
    const validIds = new Set(located.map((provider) => provider.id));

    markersRef.current.forEach((marker, id) => {
      if (validIds.has(id)) return;
      marker.remove();
      markersRef.current.delete(id);
    });

    located.forEach((provider) => {
      let marker = markersRef.current.get(provider.id);
      if (!marker) {
        const element = createMarkerElement(provider);
        element.addEventListener("click", (event) => {
          event.stopPropagation();
          selectRef.current?.(provider.id);
        });
        element.addEventListener("mouseenter", () => hoverRef.current?.(provider.id));
        element.addEventListener("mouseleave", () => hoverRef.current?.(null));
        element.addEventListener("focus", () => hoverRef.current?.(provider.id));
        element.addEventListener("blur", () => hoverRef.current?.(null));
        marker = new Marker({ element, anchor: "bottom" }).setLngLat([
          provider.location.lng,
          provider.location.lat,
        ]);
        marker.addTo(map);
        markersRef.current.set(provider.id, marker);
      } else {
        marker.setLngLat([provider.location.lng, provider.location.lat]);
      }
      updateMarkerElement(
        marker.getElement(),
        provider,
        provider.id === currentSelected,
        provider.id === currentHovered,
      );
    });

    void refreshClusterVisibility();
  }, [refreshClusterVisibility]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = new MapLibreMap({
      container,
      style: mapStyleUrl(),
      center: [stateRef.current.center.lng, stateRef.current.center.lat],
      zoom: 11,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    map.addControl(new NavigationControl({ showCompass: true, showZoom: true }), "top-right");
    map.addControl(new ScaleControl({ maxWidth: 100, unit: "metric" }), "bottom-left");

    map.on("load", () => {
      loadedRef.current = true;
      const primary = resolveCssColor("var(--primary)", "#0ea5c9");

      map.addSource(RADIUS_SOURCE, {
        type: "geojson",
        data: buildCircle(stateRef.current.center, stateRef.current.radiusKm),
      });
      const fillLayer: FillLayerSpecification = {
        id: RADIUS_FILL,
        type: "fill",
        source: RADIUS_SOURCE,
        paint: { "fill-color": primary, "fill-opacity": 0.08 },
      };
      const outlineLayer: LineLayerSpecification = {
        id: RADIUS_OUTLINE,
        type: "line",
        source: RADIUS_SOURCE,
        paint: { "line-color": primary, "line-width": 2, "line-dasharray": [2, 1.5] },
      };
      map.addLayer(fillLayer);
      map.addLayer(outlineLayer);

      map.addSource(PROVIDERS_SOURCE, {
        type: "geojson",
        data: buildProviderFeatures(stateRef.current.providers, stateRef.current.selectedId),
        cluster: true,
        clusterRadius: 55,
        clusterMaxZoom: 15,
      });
      const clusterLayer: CircleLayerSpecification = {
        id: CLUSTER_LAYER,
        type: "circle",
        source: PROVIDERS_SOURCE,
        filter: HAS_COUNT,
        paint: {
          "circle-color": primary,
          "circle-opacity": 0.9,
          "circle-radius": ["step", ["get", "point_count"], 18, 5, 22, 15, 28, 40, 34],
          "circle-stroke-width": 3,
          "circle-stroke-color": "rgba(255,255,255,0.85)",
        },
      };
      const clusterCountLayer: SymbolLayerSpecification = {
        id: CLUSTER_COUNT_LAYER,
        type: "symbol",
        source: PROVIDERS_SOURCE,
        filter: HAS_COUNT,
        layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 12 },
        paint: { "text-color": "#ffffff" },
      };
      map.addLayer(clusterLayer);
      map.addLayer(clusterCountLayer);

      map.on("click", CLUSTER_LAYER, (event) => {
        const feature = map.queryRenderedFeatures(event.point, { layers: [CLUSTER_LAYER] })[0];
        const clusterId = feature?.properties?.["cluster_id"] as number | undefined;
        const source = map.getSource(PROVIDERS_SOURCE) as GeoJSONSource | undefined;
        if (clusterId === undefined || !source) return;
        const geometry = feature.geometry;
        if (geometry.type !== "Point") return;
        void source.getClusterExpansionZoom(clusterId).then((zoom) => {
          map.easeTo({ center: [geometry.coordinates[0], geometry.coordinates[1]], zoom });
        });
      });
      map.on("mouseenter", CLUSTER_LAYER, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", CLUSTER_LAYER, () => {
        map.getCanvas().style.cursor = "";
      });

      syncProviders();
    });

    map.on("moveend", () => {
      const next = map.getCenter();
      moveEndRef.current?.({ lat: next.lat, lng: next.lng });
      void refreshClusterVisibility();
    });
    map.on("idle", () => {
      void refreshClusterVisibility();
    });

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
      loadedRef.current = false;
    };
  }, [refreshClusterVisibility, syncProviders]);

  useEffect(() => {
    syncProviders();
  }, [providers, selectedId, hoveredId, syncProviders]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    const source = map.getSource(RADIUS_SOURCE) as GeoJSONSource | undefined;
    source?.setData(buildCircle(center, radiusKm));
  }, [center, radiusKm]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    const current = map.getCenter();
    const moved =
      Math.abs(current.lat - center.lat) > 1e-5 || Math.abs(current.lng - center.lng) > 1e-5;
    if (!moved) return;
    map.easeTo({ center: [center.lng, center.lat], duration: 600 });
  }, [center]);

  return (
    <div className={cn("relative h-full w-full", className)}>
      <div
        ref={containerRef}
        role="application"
        aria-label="Mapa interactivo de proveedores HVAC"
        className="h-full w-full overflow-hidden bg-muted"
      />
      <p className="sr-only">Usa el listado de proveedores como alternativa accesible al mapa.</p>
    </div>
  );
}
