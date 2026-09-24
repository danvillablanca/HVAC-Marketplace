import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/render";
import { Alert, AlertDescription, AlertTitle } from "./alert";

const variantTokens = [
  ["default", "bg-card"],
  ["info", "border-primary/30"],
  ["success", "border-success/30"],
  ["warning", "border-warning/30"],
  ["destructive", "border-destructive/30"],
] as const;

describe("ui/Alert", () => {
  it("renderiza con role=alert y estilos base", () => {
    render(<Alert>Mensaje</Alert>);

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveClass("rounded-lg", "border");
  });

  it.each(variantTokens)("aplica la variante %s", (variant, token) => {
    render(<Alert variant={variant}>aviso</Alert>);
    expect(screen.getByRole("alert")).toHaveClass(token);
  });

  it("renderiza título y descripción", () => {
    render(
      <Alert>
        <AlertTitle>Atención</AlertTitle>
        <AlertDescription>Detalle del aviso</AlertDescription>
      </Alert>,
    );

    expect(screen.getByRole("heading", { name: "Atención" })).toHaveClass("font-medium");
    expect(screen.getByText("Detalle del aviso")).toHaveClass("text-muted-foreground");
  });
});
