import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen, waitFor, within } from "@/test/render";
import { ProviderModal } from "./provider-modal";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ProviderModal", () => {
  it("muestra el detalle demo al abrir", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    renderWithProviders(<ProviderModal providerId="p-clima-andes" open onOpenChange={vi.fn()} />);

    await screen.findByText("Clima Andes SpA");
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Clima Andes SpA")).toBeInTheDocument();
    expect(within(dialog).getByText("Verificado")).toBeInTheDocument();
    expect(within(dialog).getByText("Ventilacion industrial y comercial")).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: /llamar/i })).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: /whatsapp/i })).toBeInTheDocument();
    expect(within(dialog).getByText("contacto@climaandes.cl")).toBeInTheDocument();
  });

  it("muestra el aviso cuando el proveedor no existe", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    renderWithProviders(<ProviderModal providerId="p-no-existe" open onOpenChange={vi.fn()} />);

    expect(await screen.findByText("Proveedor no disponible")).toBeInTheDocument();
  });

  it("no renderiza el dialogo cuando open es false", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders(
      <ProviderModal providerId="p-clima-andes" open={false} onOpenChange={vi.fn()} />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  });
});
