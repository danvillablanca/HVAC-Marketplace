import { describe, it, expect } from "vitest";
import { render, screen, userEvent } from "@/test/render";
import { Input } from "./input";
import { Label } from "./label";
import { Textarea } from "./textarea";

describe("ui/Input", () => {
  it("renderiza un input con placeholder y estilos base", () => {
    render(<Input placeholder="Correo" />);

    const input = screen.getByPlaceholderText("Correo");
    expect(input.tagName).toBe("INPUT");
    expect(input).toHaveClass("h-10", "border-input");
  });

  it("acepta escritura del usuario", async () => {
    const user = userEvent.setup();
    render(<Input placeholder="Nombre" />);

    const input = screen.getByPlaceholderText("Nombre");
    await user.type(input, "Ana");
    expect(input).toHaveValue("Ana");
  });

  it("se asocia con Label mediante id/htmlFor", () => {
    render(
      <>
        <Label htmlFor="email">Correo</Label>
        <Input id="email" />
      </>,
    );

    expect(screen.getByLabelText("Correo")).toBe(screen.getByRole("textbox"));
  });

  it("respeta la prop disabled", () => {
    render(<Input disabled placeholder="x" />);
    expect(screen.getByPlaceholderText("x")).toBeDisabled();
  });
});

describe("ui/Label", () => {
  it("renderiza un label con estilos base", () => {
    render(<Label htmlFor="campo">Etiqueta</Label>);

    const label = screen.getByText("Etiqueta");
    expect(label.tagName).toBe("LABEL");
    expect(label).toHaveAttribute("for", "campo");
    expect(label).toHaveClass("text-sm", "font-medium");
  });
});

describe("ui/Textarea", () => {
  it("se asocia con Label mediante id/htmlFor", () => {
    render(
      <>
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" />
      </>,
    );

    const textarea = screen.getByLabelText("Bio");
    expect(textarea.tagName).toBe("TEXTAREA");
  });

  it("acepta escritura y aplica estilos base", async () => {
    const user = userEvent.setup();
    render(<Textarea placeholder="Escribe" />);

    const textarea = screen.getByPlaceholderText("Escribe");
    await user.type(textarea, "hola");
    expect(textarea).toHaveValue("hola");
    expect(textarea).toHaveClass("min-h-20");
  });
});
