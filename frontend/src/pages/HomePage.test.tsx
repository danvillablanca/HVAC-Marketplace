import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import HomePage from "./HomePage";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true, data: [] }) }),
  );
});

describe("HomePage", () => {
  it("renderiza las secciones principales de la landing", () => {
    renderWithProviders(<HomePage />, { route: "/" });

    expect(
      screen.getByRole("heading", { level: 1, name: /Encuentra y contrata proveedores HVAC/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cómo funciona" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Menos incertidumbre/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Clientes y proveedores que ya lo usan/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Preguntas frecuentes" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Tu próximo proveedor HVAC está a un clic/i }),
    ).toBeInTheDocument();
  });
});
