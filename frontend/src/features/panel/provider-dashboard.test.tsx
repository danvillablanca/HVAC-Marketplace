import { describe, it, expect, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import { ProviderDashboard } from "./provider-dashboard";

const SESSION_KEY = "hvac-auth-session";

beforeEach(() => {
  window.localStorage.clear();
});

describe("ProviderDashboard", () => {
  it("muestra las metricas principales", () => {
    renderWithProviders(<ProviderDashboard />);

    expect(screen.getByText("Visitas al perfil")).toBeInTheDocument();
    expect(screen.getByText("1.248")).toBeInTheDocument();
    expect(screen.getByText("Contactos")).toBeInTheDocument();
    expect(screen.getByText("Rating promedio")).toBeInTheDocument();
    expect(screen.getByText("4,8")).toBeInTheDocument();
  });

  it("muestra la tabla de leads con sus estados", () => {
    renderWithProviders(<ProviderDashboard />);

    for (const header of ["Cliente", "Servicio", "Monto estimado", "Fecha", "Estado"]) {
      expect(screen.getByRole("columnheader", { name: header })).toBeInTheDocument();
    }

    expect(screen.getByText("Constructora Andes")).toBeInTheDocument();
    expect(screen.getByText("Clinica Los Robles")).toBeInTheDocument();
    expect(screen.getByText("Nuevo")).toBeInTheDocument();
    expect(screen.getByText("Cerrado")).toBeInTheDocument();
    expect(screen.getByText("Perdido")).toBeInTheDocument();
  });

  it("saluda al proveedor autenticado por su nombre", () => {
    window.localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        id: "u-prov",
        email: "proveedor@demo.cl",
        fullName: "Maria Gonzalez",
        role: "proveedor",
      }),
    );

    renderWithProviders(<ProviderDashboard />);

    expect(screen.getByRole("heading", { name: "Hola, Maria" })).toBeInTheDocument();
  });
});
