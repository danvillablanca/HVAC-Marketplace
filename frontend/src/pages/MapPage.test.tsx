import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ProviderSummary } from "@hvac/shared";
import { renderWithProviders, screen } from "@/test/render";
import MapPage from "./MapPage";

vi.mock("maplibre-gl", () => {
  class MockMap {
    handlers: Record<string, Array<(...args: unknown[]) => void>> = {};
    on(event: string, arg2?: unknown, arg3?: unknown) {
      const cb = (typeof arg2 === "function" ? arg2 : arg3) as (...args: unknown[]) => void;
      (this.handlers[event] ??= []).push(cb);
      if (event === "load") cb();
      return this;
    }
    once(event: string, arg2?: unknown, arg3?: unknown) {
      return this.on(event, arg2, arg3);
    }
    addControl() {
      return this;
    }
    addSource() {
      return this;
    }
    addLayer() {
      return this;
    }
    getSource() {
      return {
        setData: vi.fn(),
        getClusterLeaves: vi.fn().mockResolvedValue([]),
        getClusterExpansionZoom: vi.fn().mockResolvedValue(2),
      };
    }
    getCanvas() {
      return { style: { cursor: "" } };
    }
    getCenter() {
      return { lat: 0, lng: 0 };
    }
    easeTo() {
      return this;
    }
    resize() {}
    remove() {}
    querySourceFeatures() {
      return [];
    }
    queryRenderedFeatures() {
      return [];
    }
  }
  class MockMarker {
    element: HTMLElement;
    constructor(options: { element: HTMLElement }) {
      this.element = options.element;
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
  class MockControl {}
  return {
    Map: MockMap,
    Marker: MockMarker,
    NavigationControl: MockControl,
    ScaleControl: MockControl,
  };
});

const provider: ProviderSummary = {
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

function jsonResponse(data: unknown) {
  return { ok: true, status: 200, json: async () => ({ ok: true, data }) } as unknown as Response;
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: unknown) => {
      const url = String(input);
      if (url.includes("/api/providers/search")) return jsonResponse([provider]);
      return jsonResponse([]);
    }),
  );
});

describe("MapPage", () => {
  it("renderiza el mapa y el listado con los proveedores del backend", async () => {
    renderWithProviders(<MapPage />, { route: "/mapa" });

    expect(
      screen.getByRole("application", { name: "Mapa interactivo de proveedores HVAC" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("Clima Andes SpA")).toBeInTheDocument();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/providers/search"),
      expect.anything(),
    );
  });
});
