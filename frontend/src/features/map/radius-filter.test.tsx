import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, userEvent, fireEvent } from "@/test/render";
import { RadiusFilter, type RadiusFilterProps } from "./radius-filter";

function setup(overrides: Partial<RadiusFilterProps> = {}) {
  const props: RadiusFilterProps = {
    radiusKm: 15,
    onRadiusChange: vi.fn(),
    segment: "all",
    onSegmentChange: vi.fn(),
    query: "",
    onQueryChange: vi.fn(),
    onUseMyLocation: vi.fn(),
    resultCount: 3,
    ...overrides,
  };
  renderWithProviders(<RadiusFilter {...props} />);
  return props;
}

describe("RadiusFilter", () => {
  it("muestra el radio actual y el numero de resultados", () => {
    setup();
    expect(screen.getByText("15 km")).toBeInTheDocument();
    expect(screen.getByText("3 resultados")).toBeInTheDocument();
  });

  it("al mover el slider llama onRadiusChange con un numero", () => {
    const props = setup();
    fireEvent.change(screen.getByLabelText("Radio de busqueda en kilometros"), {
      target: { value: "30" },
    });
    expect(props.onRadiusChange).toHaveBeenCalledWith(30);
  });

  it("al hacer click en 'Usar mi ubicacion' llama onUseMyLocation", async () => {
    const props = setup();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /usar mi ubicacion/i }));
    expect(props.onUseMyLocation).toHaveBeenCalledTimes(1);
  });

  it("deshabilita el boton de ubicacion mientras localiza", () => {
    setup({ locating: true });
    expect(screen.getByRole("button", { name: /usar mi ubicacion/i })).toBeDisabled();
  });

  it("no renderiza el boton de ubicacion sin onUseMyLocation", () => {
    setup({ onUseMyLocation: undefined });
    expect(screen.queryByRole("button", { name: /usar mi ubicacion/i })).not.toBeInTheDocument();
  });

  it("al cambiar el segmento llama onSegmentChange", () => {
    const props = setup();
    fireEvent.change(screen.getByLabelText("Segmento"), { target: { value: "industrial" } });
    expect(props.onSegmentChange).toHaveBeenCalledWith("industrial");
  });

  it("al escribir en el buscador llama onQueryChange", () => {
    const props = setup();
    fireEvent.change(screen.getByLabelText("Buscar servicio o proveedor"), {
      target: { value: "split" },
    });
    expect(props.onQueryChange).toHaveBeenCalledWith("split");
  });
});
