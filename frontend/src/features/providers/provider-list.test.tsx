import { describe, expect, it } from "vitest";
import type { ProviderSummary } from "@hvac/shared";
import { renderWithProviders, screen } from "@/test/render";
import { ProviderList } from "./provider-list";

function makeProvider(id: string, legalName: string): ProviderSummary {
  return {
    id,
    legalName,
    slug: id,
    segment: "comercial",
    verificationStatus: "verificado",
    ratingAvg: 4.4,
    reviewsCount: 8,
    city: "Santiago",
    commune: "Santiago",
    distanceMeters: 900,
    location: { lat: -33.44, lng: -70.65 },
    services: ["Mantencion"],
    priceFrom: 60000,
    isDemo: true,
  };
}

describe("ProviderList", () => {
  it("muestra el estado vacio con el mensaje", () => {
    renderWithProviders(<ProviderList providers={[]} />);
    expect(screen.getByText("Sin resultados")).toBeInTheDocument();
    expect(screen.getByText("No encontramos proveedores con estos filtros.")).toBeInTheDocument();
  });

  it("permite personalizar el mensaje vacio", () => {
    renderWithProviders(<ProviderList providers={[]} emptyMessage="Nada por aqui" />);
    expect(screen.getByText("Nada por aqui")).toBeInTheDocument();
  });

  it("muestra el skeleton durante la carga", () => {
    const { container } = renderWithProviders(<ProviderList providers={[]} loading />);
    const list = screen.getByLabelText("Cargando proveedores");
    expect(list).toHaveAttribute("aria-busy", "true");
    expect(container.querySelectorAll("li")).toHaveLength(5);
  });

  it("renderiza varios proveedores", () => {
    renderWithProviders(
      <ProviderList providers={[makeProvider("p-1", "Uno SpA"), makeProvider("p-2", "Dos SpA")]} />,
    );
    expect(screen.getByLabelText("Proveedores encontrados")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Uno SpA" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Dos SpA" })).toBeInTheDocument();
  });
});
