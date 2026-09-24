import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/render";
import { Separator } from "./separator";

describe("ui/Separator", () => {
  it("es decorativo por defecto (role=none) con orientación horizontal", () => {
    render(<Separator data-testid="sep" />);

    const separator = screen.getByTestId("sep");
    expect(separator).toHaveAttribute("data-orientation", "horizontal");
    expect(separator).toHaveAttribute("role", "none");
    expect(separator).toHaveClass("h-px", "w-full");
  });

  it("expone role=separator cuando no es decorativo", () => {
    render(<Separator decorative={false} />);

    const separator = screen.getByRole("separator");
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveAttribute("data-orientation", "horizontal");
  });

  it("marca aria-orientation=vertical en orientación vertical", () => {
    render(<Separator decorative={false} orientation="vertical" data-testid="v" />);

    const separator = screen.getByTestId("v");
    expect(separator).toHaveAttribute("aria-orientation", "vertical");
    expect(separator).toHaveAttribute("data-orientation", "vertical");
    expect(separator).toHaveClass("h-full", "w-px");
  });
});
