import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen, fireEvent, act } from "@/test/render";
import { MapView, type MapProvider } from "./map-view";

interface MockMapInstance {
  handlers: Record<string, Array<(payload?: unknown) => void>>;
  sources: Record<string, unknown>;
  layers: unknown[];
  center: { lat: number; lng: number };
  options: unknown;
  emit: (event: string, payload?: unknown) => void;
}

const mocks = vi.hoisted(() => ({
  maps: [] as MockMapInstance[],
  markers: [] as Array<{ element: HTMLElement }>,
  removed: [] as MockMapInstance[],
  controls: [] as unknown[],
}));

vi.mock("maplibre-gl", () => {
  class MockMap {
    handlers: Record<string, Array<(payload?: unknown) => void>> = {};
    sources: Record<string, unknown> = {};
    layers: unknown[] = [];
    canvas = { style: { cursor: "" } };
    center = { lat: 0, lng: 0 };
    options: unknown;

    constructor(options: unknown) {
      this.options = options;
      mocks.maps.push(this as unknown as MockMapInstance);
    }

    on(event: string, arg2?: unknown, arg3?: unknown) {
      const cb = (typeof arg2 === "function" ? arg2 : arg3) as (payload?: unknown) => void;
      (this.handlers[event] ??= []).push(cb);
      if (event === "load") cb();
      return this;
    }

    once(event: string, arg2?: unknown, arg3?: unknown) {
      return this.on(event, arg2, arg3);
    }

    addControl(control: unknown) {
      mocks.controls.push(control);
      return this;
    }

    addSource(id: string, spec: unknown) {
      this.sources[id] = {
        spec,
        setData: vi.fn(),
        getClusterLeaves: vi.fn().mockResolvedValue([]),
        getClusterExpansionZoom: vi.fn().mockResolvedValue(2),
      };
      return this;
    }

    addLayer(layer: unknown) {
      this.layers.push(layer);
      return this;
    }

    getSource(id: string) {
      return this.sources[id];
    }

    getCanvas() {
      return this.canvas;
    }

    getCenter() {
      return this.center;
    }

    easeTo(options: { center?: [number, number] }) {
      if (options?.center) this.center = { lat: options.center[1], lng: options.center[0] };
      return this;
    }

    resize() {}

    remove() {
      mocks.removed.push(this as unknown as MockMapInstance);
    }

    querySourceFeatures() {
      return [];
    }

    queryRenderedFeatures() {
      return [];
    }

    emit(event: string, payload?: unknown) {
      (this.handlers[event] ?? []).forEach((cb) => cb(payload ?? { point: { x: 0, y: 0 } }));
    }
  }

  class MockMarker {
    element: HTMLElement;
    constructor(options: { element: HTMLElement }) {
      this.element = options.element;
      mocks.markers.push(this as unknown as { element: HTMLElement });
    }
    setLngLat() {
      return this;
    }
    addTo() {
      return this;
    }
    remove() {}
    getElement() {
      return this.element;
    }
  }

  class MockNavigationControl {}
  class MockScaleControl {}

  return {
    Map: MockMap,
    Marker: MockMarker,
    NavigationControl: MockNavigationControl,
    ScaleControl: MockScaleControl,
  };
});

const provider: MapProvider = {
  id: "p-clima-andes",
  legalName: "Clima Andes SpA",
  slug: "clima-andes",
  segment: "industrial",
  verificationStatus: "verificado",
  ratingAvg: 4.8,
  reviewsCount: 12,
  city: "Santiago",
  commune: "Quinta Normal",
  distanceMeters: 1200,
  location: { lat: -33.43, lng: -70.7 },
  services: ["Ventilacion industrial"],
  priceFrom: 95000,
  isDemo: true,
};

const center = { lat: -33.4489, lng: -70.6693 };

beforeEach(() => {
  mocks.maps.length = 0;
  mocks.markers.length = 0;
  mocks.removed.length = 0;
  mocks.controls.length = 0;
});

describe("MapView", () => {
  it("renderiza sin crash y expone el aria-label accesible", () => {
    renderWithProviders(<MapView providers={[provider]} center={center} radiusKm={15} />);

    expect(
      screen.getByRole("application", { name: "Mapa interactivo de proveedores HVAC" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/alternativa accesible al mapa/i)).toBeInTheDocument();
  });

  it("instancia MapLibre y monta fuentes/capas al cargar", () => {
    renderWithProviders(<MapView providers={[provider]} center={center} radiusKm={15} />);

    expect(mocks.maps).toHaveLength(1);
    const map = mocks.maps[0];
    expect(Object.keys(map.sources)).toEqual(
      expect.arrayContaining(["hvac-radius", "hvac-providers"]),
    );
    expect(map.layers.length).toBeGreaterThanOrEqual(4);
    expect(mocks.controls).toHaveLength(2);
  });

  it("crea un marcador por proveedor con ubicacion y lo elimina al desmontar", () => {
    const { unmount } = renderWithProviders(
      <MapView providers={[provider]} center={center} radiusKm={15} />,
    );

    expect(mocks.markers).toHaveLength(1);
    expect(mocks.markers[0].element).toHaveAttribute("aria-label", "Ver ficha de Clima Andes SpA");

    unmount();
    expect(mocks.removed).toHaveLength(1);
  });

  it("no crea marcadores para proveedores sin ubicacion", () => {
    renderWithProviders(
      <MapView providers={[{ ...provider, location: null }]} center={center} radiusKm={15} />,
    );
    expect(mocks.markers).toHaveLength(0);
  });

  it("notifica onMoveEnd al terminar un desplazamiento", () => {
    const onMoveEnd = vi.fn();
    renderWithProviders(
      <MapView providers={[provider]} center={center} radiusKm={15} onMoveEnd={onMoveEnd} />,
    );

    act(() => {
      mocks.maps[0].emit("moveend");
    });

    expect(onMoveEnd).toHaveBeenCalledTimes(1);
    expect(onMoveEnd).toHaveBeenCalledWith(expect.objectContaining({ lat: expect.any(Number) }));
  });

  it("selecciona un proveedor al hacer click en su marcador", () => {
    const onSelectProvider = vi.fn();
    renderWithProviders(
      <MapView
        providers={[provider]}
        center={center}
        radiusKm={15}
        onSelectProvider={onSelectProvider}
      />,
    );

    fireEvent.click(mocks.markers[0].element);
    expect(onSelectProvider).toHaveBeenCalledWith(provider.id);
  });
});
