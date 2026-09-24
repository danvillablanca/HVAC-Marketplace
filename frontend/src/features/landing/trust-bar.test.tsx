import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import { TrustBar } from "./trust-bar";

describe("TrustBar", () => {
  it("renderiza la region accesible y sus senales", () => {
    renderWithProviders(<TrustBar />);

    expect(screen.getByRole("region", { name: "Señales de confianza" })).toBeInTheDocument();
    expect(screen.getByText("Proveedores verificados")).toBeInTheDocument();
    expect(screen.getByText("RUT y documentos validados")).toBeInTheDocument();
    expect(screen.getByText("Estándares ASHRAE")).toBeInTheDocument();
    expect(screen.getByText("Más de 1.200 evaluaciones")).toBeInTheDocument();
  });
});
