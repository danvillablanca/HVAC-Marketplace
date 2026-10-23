import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import { FinalCta } from "./final-cta";

describe("FinalCta", () => {
  it("muestra el headline y los enlaces de accion", () => {
    renderWithProviders(<FinalCta />);

    expect(
      screen.getByRole("heading", { name: /Tu próximo proveedor HVAC está a un clic/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Publicar requerimiento/i })).toHaveAttribute(
      "href",
      "/mapa",
    );
    expect(screen.getByRole("link", { name: /Ser proveedor/i })).toHaveAttribute(
      "href",
      "/registro",
    );
  });
});
