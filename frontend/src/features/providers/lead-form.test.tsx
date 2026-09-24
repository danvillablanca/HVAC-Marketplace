import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen, userEvent, waitFor } from "@/test/render";
import { LeadForm } from "./lead-form";

function okResponse<T>(data: T) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ ok: true, data }),
  } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("LeadForm", () => {
  it("no envia si la descripcion es muy corta", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderWithProviders(<LeadForm providerId="p-clima-andes" />);

    const submit = screen.getByRole("button", { name: /enviar solicitud/i });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText("Describe tu requerimiento"), "corto");
    expect(submit).toBeDisabled();
    await user.click(submit);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("envia el lead con los valores del formulario", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ id: "lead-1" }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderWithProviders(<LeadForm providerId="p-clima-andes" providerName="Clima Andes SpA" />);

    await user.type(
      screen.getByLabelText("Describe tu requerimiento"),
      "Necesito instalar un split inverter",
    );
    await user.selectOptions(screen.getByLabelText("Urgencia"), "alta");
    await user.selectOptions(screen.getByLabelText("Contacto preferido"), "correo");
    await user.click(screen.getByRole("button", { name: /enviar solicitud/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toContain("/api/leads");
    expect((init as RequestInit).method).toBe("POST");
    expect(JSON.parse(String((init as RequestInit).body))).toEqual({
      providerId: "p-clima-andes",
      description: "Necesito instalar un split inverter",
      urgency: "alta",
      preferredContact: "correo",
    });

    expect(await screen.findByText("Solicitud enviada")).toBeInTheDocument();
    expect(screen.getByText(/Clima Andes SpA te contactara pronto por correo/)).toBeInTheDocument();
  });

  it("muestra el mensaje de error cuando la API falla", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const user = userEvent.setup();

    renderWithProviders(<LeadForm providerId="p-clima-andes" />);

    await user.type(
      screen.getByLabelText("Describe tu requerimiento"),
      "Necesito una mantencion programada",
    );
    await user.click(screen.getByRole("button", { name: /enviar solicitud/i }));

    expect(
      await screen.findByText("No pudimos enviar la solicitud. Intenta nuevamente."),
    ).toBeInTheDocument();
  });
});
