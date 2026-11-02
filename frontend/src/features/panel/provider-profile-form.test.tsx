import { beforeEach, describe, expect, it, vi } from "vitest";
import { SERVICE_CATALOG } from "@hvac/shared";
import { renderWithProviders, screen, userEvent, waitFor } from "@/test/render";
import { ProviderProfileForm } from "./provider-profile-form";

const hooks = vi.hoisted(() => ({ mutateAsync: vi.fn() }));
vi.mock("./provider-hooks", () => ({
  useServiceCatalog: () => ({ data: SERVICE_CATALOG, isLoading: false }),
  useSaveProviderProfile: () => ({ mutateAsync: hooks.mutateAsync, isPending: false, error: null }),
}));

beforeEach(() => hooks.mutateAsync.mockReset().mockResolvedValue({}));

describe("ProviderProfileForm", () => {
  it("PR-007/PR-008 el proveedor carga sus datos y servicios del catalogo", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProviderProfileForm profile={null} />);

    await user.clear(screen.getByLabelText("Nombre comercial o razón social"));
    await user.type(screen.getByLabelText("Nombre comercial o razón social"), "Clima Test SpA");
    await user.type(screen.getByLabelText("RUT de la empresa"), "76.123.456-0");
    await user.type(screen.getByLabelText("Teléfono"), "+56 9 1111 2222");
    await user.clear(screen.getByLabelText("Correo de contacto"));
    await user.type(screen.getByLabelText("Correo de contacto"), "contacto@climatest.cl");
    await user.selectOptions(screen.getByLabelText("Comuna base"), "Ñuñoa");

    const split = SERVICE_CATALOG[1];
    await user.click(screen.getByLabelText(split.name));
    await user.type(screen.getByLabelText(`Precio desde para ${split.name}`), "90000");
    await user.click(screen.getByLabelText(SERVICE_CATALOG[11].name));

    await user.click(screen.getByRole("button", { name: /Guardar perfil/ }));

    await waitFor(() => expect(hooks.mutateAsync).toHaveBeenCalledTimes(1));
    const payload = hooks.mutateAsync.mock.calls[0][0];
    expect(payload).toMatchObject({
      legalName: "Clima Test SpA",
      rut: "761234560",
      commune: "Ñuñoa",
      coverageRadiusKm: 20,
      isAvailable: true,
    });
    expect(payload.services).toEqual([
      { serviceId: split.id, priceFrom: 90000 },
      { serviceId: SERVICE_CATALOG[11].id, priceFrom: null },
    ]);
    expect(payload.weeklyHours.lun).toEqual({ open: "09:00", close: "18:00" });
    expect(payload.weeklyHours.dom).toBeNull();
    expect(await screen.findByText(/Perfil guardado/)).toBeInTheDocument();
  });

  it("PR-008 exige al menos un servicio y una comuna", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProviderProfileForm profile={null} />);
    await user.click(screen.getByRole("button", { name: /Guardar perfil/ }));
    expect(await screen.findByText("Elige al menos un servicio")).toBeInTheDocument();
    const alerts = screen.getAllByRole("alert").map((a) => a.textContent);
    expect(alerts).toContain("Selecciona una comuna");
    expect(hooks.mutateAsync).not.toHaveBeenCalled();
  });
});
