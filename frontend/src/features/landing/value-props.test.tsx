import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import { ValueProps } from "./value-props";

describe("ValueProps", () => {
  it("muestra el titulo y las tres propuestas de valor", () => {
    renderWithProviders(<ValueProps />);

    expect(
      screen.getByRole("heading", { name: /Menos incertidumbre, mejores instalaciones/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Verificación real")).toBeInTheDocument();
    expect(screen.getByText("Todo en un mapa")).toBeInTheDocument();
    expect(screen.getByText("Decide con datos")).toBeInTheDocument();
  });
});
