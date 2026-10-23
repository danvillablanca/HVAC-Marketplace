import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/render";
import { Badge } from "./badge";

const variantTokens = [
  ["default", "bg-primary/10"],
  ["secondary", "bg-secondary"],
  ["success", "bg-success/12"],
  ["warning", "bg-warning/15"],
  ["destructive", "bg-destructive/12"],
  ["outline", "border-border"],
] as const;

describe("ui/Badge", () => {
  it("renderiza el contenido con la base de estilos", () => {
    render(<Badge>Nuevo</Badge>);

    const badge = screen.getByText("Nuevo");
    expect(badge).toBeInTheDocument();
    expect(badge.tagName).toBe("SPAN");
    expect(badge).toHaveClass("inline-flex", "rounded-full");
  });

  it.each(variantTokens)("aplica la variante %s", (variant, token) => {
    render(<Badge variant={variant}>etiqueta</Badge>);
    expect(screen.getByText("etiqueta")).toHaveClass(token);
  });

  it("respeta className adicional", () => {
    render(<Badge className="mi-clase">x</Badge>);
    expect(screen.getByText("x")).toHaveClass("mi-clase");
  });
});
