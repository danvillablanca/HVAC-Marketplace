import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen, userEvent, waitFor } from "@/test/render";
import { LeadForm } from "./lead-form";

const hooks = vi.hoisted(() => ({
  mutate: vi.fn(),
  state: {
    isSuccess: false,
    isError: false,
    isPending: false,
    data: undefined as unknown,
    error: null as unknown,
  },
}));

vi.mock("@/features/requests/hooks", () => ({
  useCreateServiceRequest: () => ({ ...hooks.state, mutate: hooks.mutate }),
}));

function login(role: "cliente" | "proveedor") {
  window.localStorage.setItem(
    "hvac-auth-session",
    JSON.stringify({ id: `u-${role}`, email: `${role}@demo.cl`, fullName: "U", role }),
  );
}

beforeEach(() => {
  window.localStorage.clear();
  hooks.mutate.mockReset();
  hooks.state = {
    isSuccess: false,
    isError: false,
    isPending: false,
    data: undefined,
    error: null,
  };
});

describe("LeadForm (solicitud directa)", () => {
  it("sin sesión invita a ingresar como cliente", () => {
    renderWithProviders(<LeadForm providerId="p-clima-andes" />);
    expect(screen.getByRole("link", { name: "ingresa" })).toHaveAttribute("href", "/ingresar");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("un proveedor no puede pedir cotizaciones", () => {
    login("proveedor");
    renderWithProviders(<LeadForm providerId="p-clima-andes" />);
    expect(screen.getByText(/Solo las cuentas de cliente/)).toBeInTheDocument();
  });

  it("crea una solicitud dirigida a la empresa con comuna y urgencia", async () => {
    login("cliente");
    const user = userEvent.setup();
    renderWithProviders(<LeadForm providerId="p-clima-andes" providerName="Clima Andes SpA" />);

    const submit = screen.getByRole("button", { name: /Enviar solicitud a Clima Andes SpA/ });
    expect(submit).toBeDisabled();

    await user.type(
      screen.getByLabelText("Describe tu requerimiento"),
      "Mantención de dos equipos split en oficina",
    );
    await user.selectOptions(screen.getByLabelText("Urgencia"), "alta");
    await user.selectOptions(screen.getByLabelText("Comuna"), "Providencia");
    await user.click(submit);

    await waitFor(() =>
      expect(hooks.mutate).toHaveBeenCalledWith({
        targetProviderId: "p-clima-andes",
        equipment: "otro",
        description: "Mantención de dos equipos split en oficina",
        urgency: "alta",
        commune: "Providencia",
        photos: [],
      }),
    );
  });

  it("muestra el error de la API (empresa que aún no recibe solicitudes)", () => {
    login("cliente");
    hooks.state = {
      ...hooks.state,
      isError: true,
      error: new Error("Esta empresa todavía no recibe solicitudes en línea."),
    };
    renderWithProviders(<LeadForm providerId="p-calor-central" />);
    expect(screen.getByRole("alert")).toHaveTextContent("todavía no recibe solicitudes");
  });
});
