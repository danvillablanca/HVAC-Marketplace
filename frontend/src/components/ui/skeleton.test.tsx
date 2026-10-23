import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/render";
import { Skeleton } from "./skeleton";

describe("ui/Skeleton", () => {
  it("renderiza un div con animación de pulso y estilos base", () => {
    render(<Skeleton data-testid="skeleton" />);

    const skeleton = screen.getByTestId("skeleton");
    expect(skeleton.tagName).toBe("DIV");
    expect(skeleton).toHaveClass("animate-pulse", "rounded-md", "bg-muted");
  });

  it("fusiona className adicional", () => {
    render(<Skeleton data-testid="skeleton" className="h-4 w-1/2" />);
    expect(screen.getByTestId("skeleton")).toHaveClass("h-4", "w-1/2");
  });

  it("propaga atributos arbitrarios", () => {
    render(<Skeleton data-testid="skeleton" aria-hidden="true" />);
    expect(screen.getByTestId("skeleton")).toHaveAttribute("aria-hidden", "true");
  });
});
