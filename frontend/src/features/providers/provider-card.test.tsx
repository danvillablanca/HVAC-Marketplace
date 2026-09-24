import { describe, expect, it, vi } from "vitest";
import { formatCLP, formatDistance, type ProviderSummary } from "@hvac/shared";
import { renderWithProviders, screen, userEvent } from "@/test/render";
import { ProviderCard } from "./provider-card";

function makeProvider(overrides: Partial<ProviderSummary> = {}): ProviderSummary {
  return {
    id: "p-card-1",
    legalName: "Clima Test SpA",
    slug: "p-card-1",
    segment: "residencial",
    verificationStatus: "verificado",
    ratingAvg: 4.5,
    reviewsCount: 12,
    city: "Santiago",
    commune: "Santiago",
    distanceMeters: 1500,
    location: { lat: -33.44, lng: -70.65 },
    services: ["Instalacion split", "Mantencion", "Carga de gas", "Extra"],
    priceFrom: 89990,
    isDemo: true,
    ...overrides,
  };
}

describe("ProviderCard", () => {
  it("muestra nombre, badge, rating, distancia y precio", () => {
    renderWithProviders(<ProviderCard provider={makeProvider()} />);

    expect(screen.getByRole("heading", { name: "Clima Test SpA" })).toBeInTheDocument();
    expect(screen.getByText("Verificado")).toBeInTheDocument();
    expect(screen.getByText("4.5 (12)")).toBeInTheDocument();
    expect(screen.getByText(`${formatDistance(1500)} · Santiago`)).toBeInTheDocument();
    expect(screen.getByText(formatCLP(89990))).toBeInTheDocument();
    expect(screen.getByText("Desde")).toBeInTheDocument();
    expect(screen.getByText("+1 mas")).toBeInTheDocument();
  });

  it("muestra badge de pendiente segun el estado", () => {
    renderWithProviders(
      <ProviderCard provider={makeProvider({ verificationStatus: "pendiente" })} />,
    );
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
  });

  it("dispara onSelect con el id al hacer click", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<ProviderCard provider={makeProvider()} onSelect={onSelect} />);

    await user.click(screen.getByRole("button"));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("p-card-1");
  });

  it("refleja el estado seleccionado con aria-pressed", () => {
    renderWithProviders(<ProviderCard provider={makeProvider()} selected />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });
});
