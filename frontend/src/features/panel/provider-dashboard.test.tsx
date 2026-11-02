import { describe, it, expect, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import { ProviderDashboard } from "./provider-dashboard";

const SESSION_KEY = "hvac-auth-session";

beforeEach(() => {
  window.localStorage.clear();
});

describe("ProviderDashboard", () => {
  it("muestra las métricas principales", () => {
    renderWithProviders(<ProviderDashboard />);

    expect(screen.getByText("Solicitudes abiertas")).toBeInTheDocument();
    expect(screen.getByText("Total solicitudes")).toBeInTheDocument();
    expect(screen.getByText("Notificaciones")).toBeInTheDocument();
  });

  it("muestra la sección de solicitudes disponibles con link a bandeja", () => {
    renderWithProviders(<ProviderDashboard />);

    expect(screen.getByText("Solicitudes disponibles")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ir a la bandeja/ })).toBeInTheDocument();
  });

  it("muestra tarjetas de verificación y bandeja", () => {
    renderWithProviders(<ProviderDashboard />);

    expect(screen.getByText("Estado de verificacion")).toBeInTheDocument();
    expect(screen.getByText("Bandeja de cotizaciones")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /bandeja/ }).length).toBeGreaterThanOrEqual(1);
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
