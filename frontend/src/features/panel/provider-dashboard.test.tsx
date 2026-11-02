import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import { ProviderDashboard } from "./provider-dashboard";

const SESSION_KEY = "hvac-auth-session";

const hooks = vi.hoisted(() => ({ profile: undefined as unknown, isLoading: false }));
vi.mock("./provider-hooks", () => ({
  useMyProviderProfile: () => ({ data: hooks.profile, isLoading: hooks.isLoading }),
}));

beforeEach(() => {
  window.localStorage.clear();
  hooks.profile = undefined;
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

  it("'Editar perfil' lleva al formulario de perfil y no a 'Para proveedores'", () => {
    hooks.profile = { verificationStatus: "verificado", verificationNote: null };
    renderWithProviders(<ProviderDashboard />);
    const link = screen.getByRole("link", { name: /Editar perfil/ });
    expect(link).toHaveAttribute("href", "/panel/proveedor/perfil");
    expect(screen.getByText("Verificado")).toBeInTheDocument();
  });

  it("sin perfil invita a completarlo y no muestra 'Verificado'", () => {
    hooks.profile = null;
    renderWithProviders(<ProviderDashboard />);
    expect(screen.getByText("Completa el perfil de tu empresa")).toBeInTheDocument();
    expect(screen.queryByText("Verificado")).not.toBeInTheDocument();
    expect(screen.getByText("Sin verificar")).toBeInTheDocument();
  });

  it("muestra el motivo de un rechazo", () => {
    hooks.profile = { verificationStatus: "rechazado", verificationNote: "Patente vencida" };
    renderWithProviders(<ProviderDashboard />);
    expect(screen.getByText("Motivo: Patente vencida")).toBeInTheDocument();
  });
});
