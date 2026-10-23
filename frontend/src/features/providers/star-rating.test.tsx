import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import { StarRating } from "./star-rating";

describe("StarRating", () => {
  it("renderiza 5 estrellas", () => {
    const { container } = renderWithProviders(<StarRating value={3} />);
    expect(container.querySelectorAll("svg")).toHaveLength(5);
  });

  it("refleja el valor y el conteo", () => {
    const { container } = renderWithProviders(<StarRating value={4.8} count={132} />);
    expect(screen.getByLabelText("Calificacion 4.8 de 5")).toBeInTheDocument();
    expect(screen.getByText("4.8 (132)")).toBeInTheDocument();

    const filled = [...container.querySelectorAll("svg")].filter((svg) =>
      svg.classList.contains("fill-warning"),
    );
    expect(filled).toHaveLength(5);
  });

  it("redondea el numero de estrellas rellenas", () => {
    const { container } = renderWithProviders(<StarRating value={3.4} />);
    const filled = [...container.querySelectorAll("svg")].filter((svg) =>
      svg.classList.contains("fill-warning"),
    );
    expect(filled).toHaveLength(3);
  });

  it("trata valores invalidos como 0", () => {
    const { container } = renderWithProviders(<StarRating value={null} />);
    expect(screen.getByLabelText("Calificacion 0.0 de 5")).toBeInTheDocument();
    expect(container.querySelectorAll("svg.fill-warning")).toHaveLength(0);
  });
});
