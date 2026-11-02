import { beforeEach, describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import { SiteHeader } from "./site-header";

beforeEach(() => window.localStorage.clear());

function login(role: "cliente" | "proveedor") {
  window.localStorage.setItem(
    "hvac-auth-session",
    JSON.stringify({ id: `u-${role}`, email: `${role}@demo.cl`, fullName: "Usuario", role }),
  );
}

describe("SiteHeader", () => {
  it("muestra 'Para proveedores' a visitantes sin sesion", () => {
    renderWithProviders(<SiteHeader />);
    expect(screen.getAllByRole("link", { name: "Para proveedores" }).length).toBeGreaterThan(0);
  });

  for (const role of ["cliente", "proveedor"] as const) {
    it(`oculta 'Para proveedores' con sesion de ${role}`, () => {
      login(role);
      renderWithProviders(<SiteHeader />);
      expect(screen.queryByRole("link", { name: "Para proveedores" })).not.toBeInTheDocument();
      expect(screen.getAllByRole("link", { name: "Buscar proveedores" }).length).toBeGreaterThan(0);
    });
  }
});
