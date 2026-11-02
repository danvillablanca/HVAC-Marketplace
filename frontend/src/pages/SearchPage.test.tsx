import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ProviderSummary } from "@hvac/shared";
import { renderWithProviders, screen, userEvent, waitFor } from "@/test/render";
import SearchPage from "./SearchPage";

const providers: ProviderSummary[] = [
  {
    id: "p-lejano",
    legalName: "Frio Lejano Ltda.",
    slug: "frio-lejano",
    segment: "comercial",
    verificationStatus: "en_revision",
    ratingAvg: 4.2,
    reviewsCount: 4,
    city: "Santiago",
    commune: "Maipu",
    distanceMeters: 5000,
    location: { lat: -33.5, lng: -70.75 },
    services: ["Aire acondicionado comercial"],
    priceFrom: 120000,
    isDemo: true,
  },
  {
    id: "p-cerca",
    legalName: "Clima Andes SpA",
    slug: "clima-andes",
    segment: "industrial",
    verificationStatus: "verificado",
    ratingAvg: 4.9,
    reviewsCount: 40,
    city: "Santiago",
    commune: "Quinta Normal",
    distanceMeters: 800,
    location: { lat: -33.43, lng: -70.7 },
    services: ["Ventilacion industrial"],
    priceFrom: 95000,
    isDemo: true,
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
      if (url.includes("/api/providers/search"))
        return jsonResponse({ items: providers, total: providers.length, limit: 10, offset: 0 });
      return jsonResponse([]);
    }),
  );
});

describe("SearchPage", () => {
  it("renderiza el encabezado y respeta el orden que entrega la API", async () => {
    renderWithProviders(<SearchPage />, { route: "/buscar" });

    expect(
      screen.getByRole("heading", { level: 1, name: "Buscar proveedores" }),
    ).toBeInTheDocument();

    const cards = await screen.findAllByRole("button", { name: /Clima Andes SpA|Frio Lejano/i });
    expect(cards).toHaveLength(2);
    // BUS-03: el orden y la paginacion los resuelve el servidor.
    expect(cards[0]).toHaveTextContent("Frio Lejano");
    expect(await screen.findByText("Clima Andes SpA")).toBeInTheDocument();
    expect(screen.getByText("Mostrando 1–2 de 2 proveedores")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Paginación" })).not.toBeInTheDocument();
  });

  it("PR-016 BUS-01 busca desde la comuna elegida y PR-018 pagina de a 10", async () => {
    const many = Array.from({ length: 10 }, (_, i) => ({
      ...providers[0],
      id: `p-${i}`,
      legalName: `Proveedor ${i}`,
    }));
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/providers/search")) {
          return jsonResponse({ items: many, total: 23, limit: 10, offset: 0 });
        }
        return jsonResponse([]);
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<SearchPage />, { route: "/buscar" });

    expect(await screen.findByText("Mostrando 1–10 de 23 proveedores")).toBeInTheDocument();
    expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Comuna"), "Lo Barnechea");
    await waitFor(() => {
      const calls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.map((c) =>
        String(c[0]),
      );
      expect(calls.some((u) => u.includes("lat=-33.35") && u.includes("radiusKm=10"))).toBe(true);
    });
    expect(screen.getByText("Resultados cerca de Lo Barnechea.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Siguiente/ }));
    await waitFor(() => {
      const calls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.map((c) =>
        String(c[0]),
      );
      expect(calls.some((u) => u.includes("offset=10"))).toBe(true);
    });
  });
});
