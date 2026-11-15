import { beforeEach, describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import { SiteHeader } from "./site-header";

beforeEach(() => window.localStorage.clear());

function login(role: "cliente" | "proveedor" | "admin") {
  window.localStorage.setItem(
    "hvac-auth-session",
    JSON.stringify({ id: `u-${role}`, email: `${role}@demo.cl`, fullName: "Usuario", role }),
  );
}

const nav = () =>
  Array.from(
    screen.getByRole("navigation", { name: "Principal" }).querySelectorAll("a"),
    (a) => a.textContent,
  );

describe("SiteHeader: navegación según el rol", () => {
  it("visitante: herramientas de búsqueda y 'Para proveedores'", () => {
    renderWithProviders(<SiteHeader />);
    expect(nav()).toEqual(["Mapa", "Buscar proveedores", "Asistente IA", "Para proveedores"]);
  });

  it("cliente: busca y contrata, sin 'Para proveedores'", () => {
    login("cliente");
    renderWithProviders(<SiteHeader />);
    expect(nav()).toEqual(["Mapa", "Buscar proveedores", "Asistente IA"]);
  });

  it("proveedor: solo sus herramientas (bandeja y su empresa)", () => {
    login("proveedor");
    renderWithProviders(<SiteHeader />);
    expect(nav()).toEqual(["Bandeja", "Mi empresa"]);
  });

  it("admin: verificaciones y búsqueda", () => {
    login("admin");
    renderWithProviders(<SiteHeader />);
    expect(nav()).toEqual(["Mapa", "Buscar proveedores", "Verificaciones"]);
  });
});
