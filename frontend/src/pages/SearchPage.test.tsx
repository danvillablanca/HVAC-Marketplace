import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ProviderSummary } from "@hvac/shared";
import { renderWithProviders, screen } from "@/test/render";
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
      if (url.includes("/api/providers/search")) return jsonResponse(providers);
      return jsonResponse([]);
    }),
  );
});

describe("SearchPage", () => {
  it("renderiza el encabezado y los proveedores ordenados por distancia", async () => {
    renderWithProviders(<SearchPage />, { route: "/buscar" });

    expect(
      screen.getByRole("heading", { level: 1, name: "Buscar proveedores" }),
    ).toBeInTheDocument();

    const cards = await screen.findAllByRole("button", { name: /Clima Andes SpA|Frio Lejano/i });
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent("Clima Andes SpA");
    expect(await screen.findByText("Clima Andes SpA")).toBeInTheDocument();
    expect(screen.getByText("2 proveedores")).toBeInTheDocument();
  });
});
