import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent } from "@/test/render";
import { Switch } from "./switch";

describe("ui/Switch", () => {
  it("renderiza apagado con aria-checked=false", () => {
    render(<Switch aria-label="notificaciones" />);

    const sw = screen.getByRole("switch", { name: "notificaciones" });
    expect(sw).toHaveAttribute("aria-checked", "false");
    expect(sw).toHaveAttribute("data-state", "unchecked");
  });

  it("alterna aria-checked al hacer click (no controlado)", async () => {
    const user = userEvent.setup();
    render(<Switch aria-label="notificaciones" />);

    const sw = screen.getByRole("switch", { name: "notificaciones" });
    await user.click(sw);
    expect(sw).toHaveAttribute("aria-checked", "true");
    expect(sw).toHaveAttribute("data-state", "checked");

    await user.click(sw);
    expect(sw).toHaveAttribute("aria-checked", "false");
  });

  it("respeta defaultChecked", () => {
    render(<Switch aria-label="x" defaultChecked />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("en modo controlado no cambia solo y notifica onCheckedChange", async () => {
    const onCheckedChange = vi.fn();
    const user = userEvent.setup();
    render(<Switch aria-label="x" checked={false} onCheckedChange={onCheckedChange} />);

    const sw = screen.getByRole("switch");
    await user.click(sw);

    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(sw).toHaveAttribute("aria-checked", "false");
  });

  it("no alterna cuando está disabled", async () => {
    const onCheckedChange = vi.fn();
    const user = userEvent.setup();
    render(<Switch aria-label="x" disabled onCheckedChange={onCheckedChange} />);

    await user.click(screen.getByRole("switch"));
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(screen.getByRole("switch")).toBeDisabled();
  });
});
