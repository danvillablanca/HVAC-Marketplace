import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent } from "@/test/render";
import { Button } from "./button";

const variantTokens = [
  ["default", "bg-primary"],
  ["accent", "bg-accent"],
  ["destructive", "bg-destructive"],
  ["outline", "border-border"],
  ["secondary", "bg-secondary"],
  ["ghost", "hover:bg-secondary"],
  ["link", "text-primary"],
] as const;

const sizeTokens = [
  ["default", "h-10"],
  ["sm", "h-9"],
  ["lg", "h-12"],
  ["icon", "size-10"],
] as const;

describe("ui/Button", () => {
  it("renderiza los children y la base de estilos", () => {
    render(<Button>Guardar</Button>);

    const button = screen.getByRole("button", { name: "Guardar" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("inline-flex", "items-center");
  });

  it.each(variantTokens)("aplica la variante %s", (variant, token) => {
    render(<Button variant={variant}>x</Button>);
    expect(screen.getByRole("button")).toHaveClass(token);
  });

  it.each(sizeTokens)("aplica el tamaño %s", (size, token) => {
    render(<Button size={size}>x</Button>);
    expect(screen.getByRole("button")).toHaveClass(token);
  });

  it("respeta className adicional", () => {
    render(<Button className="mi-clase">x</Button>);
    expect(screen.getByRole("button")).toHaveClass("mi-clase");
  });

  it("dispara onClick", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Pulsa</Button>);

    await user.click(screen.getByRole("button", { name: "Pulsa" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("no dispara onClick cuando está disabled", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button disabled onClick={onClick}>
        Pulsa
      </Button>,
    );

    await user.click(screen.getByRole("button", { name: "Pulsa" }));
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("asChild renderiza el hijo fusionando clases y props", () => {
    render(
      <Button asChild>
        <a href="/proveedores">Ir</a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: "Ir" });
    expect(link).toHaveAttribute("href", "/proveedores");
    expect(link).toHaveClass("inline-flex", "bg-primary");
    expect(link.tagName).toBe("A");
  });
});
