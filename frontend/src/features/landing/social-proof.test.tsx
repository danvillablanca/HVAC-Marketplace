import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import { SocialProof } from "./social-proof";

describe("SocialProof", () => {
  it("muestra el titulo y los testimonios", () => {
    renderWithProviders(<SocialProof />);

    expect(
      screen.getByRole("heading", { name: /Clientes y proveedores que ya lo usan/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Camila Rojas")).toBeInTheDocument();
    expect(screen.getByText("Rodrigo Fuentes")).toBeInTheDocument();
    expect(screen.getByText("Valentina Soto")).toBeInTheDocument();
    expect(screen.getByText(/Publiqué el requerimiento un lunes/i)).toBeInTheDocument();
  });

  it("lista los sectores cubiertos", () => {
    renderWithProviders(<SocialProof />);

    expect(screen.getByText("Data centers")).toBeInTheDocument();
    expect(screen.getByText("Minería")).toBeInTheDocument();
    expect(screen.getByText(/Sectores y equipos que cubrimos/i)).toBeInTheDocument();
  });
});
