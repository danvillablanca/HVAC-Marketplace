import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ServiceRequest } from "@hvac/shared";
import { renderWithProviders, screen } from "@/test/render";
import { ProviderDashboard } from "./provider-dashboard";

const hooks = vi.hoisted(() => ({
  profile: undefined as unknown,
  requests: [] as Partial<ServiceRequest>[],
}));
vi.mock("./provider-hooks", () => ({
  useMyProviderProfile: () => ({ data: hooks.profile, isLoading: false }),
  useProviderMetrics: () => ({ data: undefined, isLoading: true, error: null }),
}));
vi.mock("@/features/requests/hooks", () => ({
  useServiceRequests: () => ({ data: hooks.requests }),
}));

const profile = (extra: Record<string, unknown> = {}) => ({
  legalName: "Hogar Fresco Instalaciones",
  verificationStatus: "verificado",
  verificationNote: null,
  isAvailable: true,
  coverageRadiusKm: 30,
  commune: "La Florida",
  services: [{ serviceId: "s1", name: "Split", priceFrom: null }],
  ...extra,
});

const req = (id: string, extra: Partial<ServiceRequest>): Partial<ServiceRequest> => ({
  id,
  serviceName: `Servicio ${id}`,
  equipment: "split",
  commune: "Ñuñoa",
  description: `Detalle ${id}`,
  status: "abierta",
  myQuoteStatus: null,
  ...extra,
});

beforeEach(() => {
  window.localStorage.clear();
  hooks.profile = profile();
  hooks.requests = [];
});

describe("ProviderDashboard (panel propio del proveedor)", () => {
  it("muestra la empresa, su estado y métricas de proveedor (no las del cliente)", () => {
    hooks.requests = [
      req("a", {}),
      req("b", { isDirect: true }),
      req("c", { status: "con_cotizaciones", myQuoteStatus: "enviada" }),
      req("d", { status: "en_ejecucion", myQuoteStatus: "aceptada" }),
      req("e", {
        status: "completada",
        myQuoteStatus: "aceptada",
        clientConfirmedAt: "2026-11-01",
      }),
    ];
    renderWithProviders(<ProviderDashboard />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Hogar Fresco Instalaciones",
    );
    expect(screen.getByText("Panel de proveedor")).toBeInTheDocument();
    const metric = (label: string) => screen.getAllByText(label)[0].nextElementSibling?.textContent;
    expect(metric("Por cotizar")).toBe("2");
    expect(metric("Cotizaciones enviadas")).toBe("1");
    expect(metric("Trabajos en curso")).toBe("1");
    expect(metric("Completados")).toBe("1");
    expect(screen.queryByText("Nueva solicitud")).not.toBeInTheDocument();
  });

  it("lista las solicitudes por cotizar destacando las directas y los trabajos con su siguiente paso", () => {
    hooks.requests = [
      req("a", { isDirect: true }),
      req("d", { status: "aceptada", myQuoteStatus: "aceptada" }),
    ];
    renderWithProviders(<ProviderDashboard />);
    expect(screen.getByText("Directa a tu empresa")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Servicio d/ })).toHaveAttribute(
      "href",
      "/panel/solicitudes/d",
    );
    expect(screen.getByText("Siguiente paso: marcar en ejecución")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ir a la bandeja/ })).toHaveAttribute(
      "href",
      "/panel/proveedor/bandeja",
    );
  });

  it("'Editar perfil' lleva al formulario de perfil", () => {
    renderWithProviders(<ProviderDashboard />);
    expect(screen.getByRole("link", { name: /Editar perfil/ })).toHaveAttribute(
      "href",
      "/panel/proveedor/perfil",
    );
    expect(screen.getByText(/1 servicios · hasta 30 km desde La Florida/)).toBeInTheDocument();
  });

  it("sin perfil invita a completarlo y no muestra 'Verificado'", () => {
    hooks.profile = null;
    renderWithProviders(<ProviderDashboard />);
    expect(screen.getByText("Completa el perfil de tu empresa")).toBeInTheDocument();
    expect(screen.queryByText("Verificado")).not.toBeInTheDocument();
    expect(screen.getAllByText("Sin verificar").length).toBeGreaterThan(0);
  });

  it("muestra el motivo de un rechazo", () => {
    hooks.profile = profile({
      verificationStatus: "rechazado",
      verificationNote: "Patente vencida",
    });
    renderWithProviders(<ProviderDashboard />);
    expect(screen.getByText("Motivo: Patente vencida")).toBeInTheDocument();
  });

  it("explica por que no aparece en la busqueda y enlaza a verificarse", () => {
    hooks.profile = profile({
      verificationStatus: "pendiente",
      commune: "Lo Barnechea",
      coverageRadiusKm: 20,
    });
    renderWithProviders(<ProviderDashboard />);
    expect(screen.getByText("¿Por qué no apareces en la búsqueda?")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Enviar a verificación" })).toHaveAttribute(
      "href",
      "/panel/proveedor/verificacion",
    );
  });

  it("confirma la visibilidad cuando esta verificado y disponible", () => {
    renderWithProviders(<ProviderDashboard />);
    expect(screen.getByText("Tu empresa aparece en la búsqueda")).toBeInTheDocument();
  });
});
