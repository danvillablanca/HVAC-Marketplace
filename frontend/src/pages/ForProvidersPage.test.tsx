import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import ForProvidersPage from "./ForProvidersPage";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true, data: [] }) }),
  );
});

describe("ForProvidersPage", () => {
  it("renderiza el hero, beneficios y FAQ de proveedores", () => {
    renderWithProviders(<ForProvidersPage />, { route: "/para-proveedores" });

    expect(
      screen.getByRole("heading", { level: 1, name: /Crece con clientes/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Beneficios de ser proveedor verificado/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Cómo registrarte y verificarte/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Preguntas de proveedores" })).toBeInTheDocument();
  });
});
