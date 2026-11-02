import { describe, expect, it, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import { App } from "./App";

// PR-004: toda ruta /panel/* exige sesion y rol.
const PANEL_ROUTES = [
  "/panel/solicitudes",
  "/panel/solicitudes/nueva",
  "/panel/solicitudes/abc",
  "/panel/proveedor",
  "/panel/proveedor/verificacion",
  "/panel/proveedor/bandeja",
  "/panel/cuenta",
  "/panel/admin/verificaciones",
];

beforeEach(() => window.localStorage.clear());

describe("PR-004 rutas del panel protegidas", () => {
  for (const route of PANEL_ROUTES) {
    it(`${route} redirige a /ingresar sin sesion`, async () => {
      renderWithProviders(<App />, { route });
      expect(
        await screen.findByRole("heading", { name: "Bienvenido de vuelta" }),
      ).toBeInTheDocument();
    });
  }

  it("un cliente no entra al panel de admin", async () => {
    window.localStorage.setItem(
      "hvac-auth-session",
      JSON.stringify({ id: "c", email: "cliente@demo.cl", fullName: "C", role: "cliente" }),
    );
    renderWithProviders(<App />, { route: "/panel/admin/verificaciones" });
    // Rebota a /ingresar y, con sesion de cliente, termina en su propio panel.
    expect(await screen.findByRole("heading", { name: /Hola, C/ })).toBeInTheDocument();
    expect(screen.queryByText("Bandeja de verificacion")).not.toBeInTheDocument();
  });
});
