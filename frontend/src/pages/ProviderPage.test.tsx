import { describe, it, expect, vi, beforeEach } from "vitest";
import { Route, Routes } from "react-router-dom";
import type { ProviderDetail, Review } from "@hvac/shared";
import { renderWithProviders, screen } from "@/test/render";
import ProviderPage from "./ProviderPage";

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

const provider: ProviderDetail = {
  id: "p-clima-andes",
  legalName: "Clima Andes SpA",
  slug: "clima-andes",
  segment: "industrial",
  verificationStatus: "verificado",
  ratingAvg: 4.8,
  reviewsCount: 12,
  city: "Santiago",
  commune: "Quinta Normal",
  distanceMeters: null,
  location: { lat: -33.43, lng: -70.7 },
  services: ["Ventilacion industrial"],
  priceFrom: 95000,
  isDemo: true,
  rut: "76.543.210-K",
  email: "contacto@climaandes.cl",
  phone: "+56973337025",
  description: "Ingenieria HVAC industrial y salas limpias.",
  address: "Lope de Ulloa 1760, Quinta Normal",
  modalities: ["Visita a domicilio"],
  servicesDetailed: [
    { id: "svc-1", name: "Ventilacion industrial", priceFrom: 180000, unit: "visita" },
  ],
};

const reviews: Review[] = [
  {
    id: "r-1",
    providerId: "p-clima-andes",
    rating: 5,
    comment: "Excelente servicio.",
    authorName: "Ana Perez",
    createdAt: "2026-01-02T00:00:00.000Z",
    verified: true,
  },
];

function jsonResponse(data: unknown) {
  return { ok: true, status: 200, json: async () => ({ ok: true, data }) } as unknown as Response;
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: unknown) => {
      const url = String(input);
      if (url.includes("/reviews")) return jsonResponse(reviews);
      if (url.includes("/api/providers/p-clima-andes")) return jsonResponse(provider);
      return jsonResponse(null);
    }),
  );
});

describe("ProviderPage", () => {
  it("renderiza la ficha del proveedor y sus resenas", async () => {
    renderWithProviders(
      <Routes>
        <Route path="/proveedor/:id" element={<ProviderPage />} />
      </Routes>,
      { route: "/proveedor/p-clima-andes" },
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: "Clima Andes SpA" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Sobre el proveedor")).toBeInTheDocument();
    expect(screen.getByText("Contacto")).toBeInTheDocument();
    expect(await screen.findByText("Excelente servicio.")).toBeInTheDocument();
  });

  it("muestra 'Proveedor no encontrado' si el backend no lo devuelve", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(null)));

    renderWithProviders(
      <Routes>
        <Route path="/proveedor/:id" element={<ProviderPage />} />
      </Routes>,
      { route: "/proveedor/desconocido" },
    );

    expect(
      await screen.findByRole("heading", { name: "Proveedor no encontrado" }),
    ).toBeInTheDocument();
  });
});
