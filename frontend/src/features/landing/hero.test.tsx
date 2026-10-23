import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import { Hero } from "./hero";

describe("Hero", () => {
  it("muestra el headline principal y el sello", () => {
    renderWithProviders(<Hero />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent(/Encuentra y contrata proveedores HVAC/i);
    expect(heading).toHaveTextContent(/verificados/i);
    expect(screen.getByText(/Respaldado por ASHRAE/i)).toBeInTheDocument();
  });

  it("renderiza los CTA hacia mapa y busqueda", () => {
    renderWithProviders(<Hero />);

    expect(screen.getByRole("link", { name: /Publicar requerimiento gratis/i })).toHaveAttribute(
      "href",
      "/mapa",
    );
    expect(screen.getByRole("link", { name: /Ver proveedores cerca/i })).toHaveAttribute(
      "href",
      "/buscar",
    );
  });

  it("lista las senales de confianza", () => {
    renderWithProviders(<Hero />);

    expect(screen.getByText("Perfiles verificados")).toBeInTheDocument();
    expect(screen.getByText("4,8/5 en reseñas")).toBeInTheDocument();
    expect(screen.getByText("Cobertura nacional")).toBeInTheDocument();
  });
});
