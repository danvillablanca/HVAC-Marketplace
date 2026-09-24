import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import { HowItWorks } from "./how-it-works";

describe("HowItWorks", () => {
  it("muestra el titulo y los tres pasos numerados", () => {
    renderWithProviders(<HowItWorks />);

    expect(screen.getByRole("heading", { name: /Cómo funciona/i })).toBeInTheDocument();
    const steps = screen.getAllByRole("listitem");
    expect(steps).toHaveLength(3);
    expect(screen.getByRole("heading", { name: "Publica" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Compara" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Contrata" })).toBeInTheDocument();
  });
});
