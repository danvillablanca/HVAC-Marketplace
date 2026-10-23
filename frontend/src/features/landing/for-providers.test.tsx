import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import { ForProviders } from "./for-providers";

describe("ForProviders", () => {
  it("muestra el heading, beneficios y CTA de registro", () => {
    renderWithProviders(<ForProviders />);

    expect(
      screen.getByRole("heading", {
        name: /Consigue trabajos de clientes que ya te están buscando/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Más clientes")).toBeInTheDocument();
    expect(screen.getByText("Perfil verificado")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Quiero ser proveedor/i })).toHaveAttribute(
      "href",
      "/registro",
    );
  });

  it("renderiza la vista previa del proveedor", () => {
    renderWithProviders(<ForProviders />);

    expect(screen.getByText("Maestranza Frío Ltda.")).toBeInTheDocument();
    expect(screen.getByText(/Solicitud nueva · Providencia/i)).toBeInTheDocument();
  });
});
