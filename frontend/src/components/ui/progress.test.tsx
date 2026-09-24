import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/render";
import { Progress } from "./progress";

describe("ui/Progress", () => {
  it("expone los atributos aria de la barra", () => {
    render(<Progress value={40} />);

    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(bar).toHaveAttribute("aria-valuenow", "40");
  });

  it("usa value=0 por defecto", () => {
    render(<Progress />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("recorta valores fuera de rango", () => {
    const { rerender } = render(<Progress value={150} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");

    rerender(<Progress value={-20} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("respeta un max personalizado", () => {
    render(<Progress value={3} max={10} />);

    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuemax", "10");
    expect(bar).toHaveAttribute("aria-valuenow", "3");
  });

  it("aplica la transformación según el porcentaje", () => {
    render(<Progress value={25} />);
    const fill = screen.getByRole("progressbar").firstElementChild as HTMLElement;
    expect(fill.style.transform).toBe("translateX(-75%)");
  });
});
