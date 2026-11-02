import { describe, it, expect, beforeEach, vi } from "vitest";
import type { UserEvent } from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor, userEvent } from "@/test/render";
import { VerificationWizard } from "./verification-wizard";

const DOCUMENT_LABELS = [
  "Cedula de identidad del representante legal",
  "Certificado de instalador electrico / SEC",
  "Certificacion ASHRAE o equivalente tecnico",
  "Boleta electronica habilitada",
];

async function fillCompanyStep(user: UserEvent) {
  await user.type(screen.getByLabelText("Razon social"), "Clima Andes SpA");
  await user.type(screen.getByLabelText("RUT"), "12.345.678-5");
  await user.type(screen.getByLabelText("Telefono"), "+56 9 1234 5678");
  await user.type(screen.getByLabelText("Correo de contacto"), "contacto@climaandes.cl");
}

const hooks = vi.hoisted(() => ({
  profile: undefined as unknown,
  mutateAsync: vi.fn(),
}));

vi.mock("./provider-hooks", () => ({
  useMyProviderProfile: () => ({ data: hooks.profile }),
  useRequestVerification: () => ({ mutateAsync: hooks.mutateAsync, isPending: false, error: null }),
}));

beforeEach(() => {
  window.localStorage.clear();
  hooks.profile = undefined;
  hooks.mutateAsync.mockReset().mockResolvedValue({});
});

describe("VerificationWizard", () => {
  it("recorre los pasos con datos validos hasta 'en revision'", async () => {
    const user = userEvent.setup();
    renderWithProviders(<VerificationWizard />);

    expect(screen.getByText(/Paso 1 de 3/)).toBeInTheDocument();

    await fillCompanyStep(user);
    await user.click(screen.getByRole("button", { name: /Continuar/ }));

    expect(await screen.findByText(/Paso 2 de 3/)).toBeInTheDocument();

    for (const label of DOCUMENT_LABELS) {
      await user.click(screen.getByLabelText(label));
    }
    await user.click(screen.getByRole("button", { name: /Continuar/ }));

    expect(await screen.findByText(/Paso 3 de 3/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Enviar a revision/ }));

    expect(await screen.findByText("Solicitud en revision")).toBeInTheDocument();
    expect(screen.getByText(/Estado: en revision/)).toBeInTheDocument();
  });

  it("no avanza desde el paso 1 con datos invalidos", async () => {
    const user = userEvent.setup();
    renderWithProviders(<VerificationWizard />);

    await user.click(screen.getByRole("button", { name: /Continuar/ }));

    expect(await screen.findByText("Razon social demasiado corta")).toBeInTheDocument();
    expect(screen.getByText(/Paso 1 de 3/)).toBeInTheDocument();
    expect(screen.queryByText(/Paso 2 de 3/)).not.toBeInTheDocument();
  });

  it("exige adjuntar todos los documentos para continuar", async () => {
    const user = userEvent.setup();
    renderWithProviders(<VerificationWizard />);

    await fillCompanyStep(user);
    await user.click(screen.getByRole("button", { name: /Continuar/ }));
    expect(await screen.findByText(/Paso 2 de 3/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Continuar/ }));

    expect(
      await screen.findByText("Debes adjuntar todos los documentos obligatorios."),
    ).toBeInTheDocument();
    expect(screen.getByText(/Paso 2 de 3/)).toBeInTheDocument();
  });

  it("permite volver atras y editar la solicitud enviada", async () => {
    const user = userEvent.setup();
    renderWithProviders(<VerificationWizard />);

    await fillCompanyStep(user);
    await user.click(screen.getByRole("button", { name: /Continuar/ }));
    for (const label of DOCUMENT_LABELS) {
      await user.click(screen.getByLabelText(label));
    }
    await user.click(screen.getByRole("button", { name: /Continuar/ }));
    await user.click(screen.getByRole("button", { name: /Enviar a revision/ }));

    await screen.findByText("Solicitud en revision");
    await user.click(screen.getByRole("button", { name: "Editar datos" }));

    await waitFor(() => expect(screen.getByText(/Paso 1 de 3/)).toBeInTheDocument());
    expect(screen.getByLabelText("Razon social")).toHaveValue("Clima Andes SpA");
  });

  it("PR-013 envia los documentos declarados al backend", async () => {
    const user = userEvent.setup();
    renderWithProviders(<VerificationWizard />);
    await fillCompanyStep(user);
    await user.click(screen.getByRole("button", { name: /Continuar/ }));
    for (const label of DOCUMENT_LABELS) await user.click(screen.getByLabelText(label));
    await user.click(screen.getByRole("button", { name: /Continuar/ }));
    await user.click(screen.getByRole("button", { name: /Enviar a revision/ }));
    await waitFor(() =>
      expect(hooks.mutateAsync).toHaveBeenCalledWith({ documents: DOCUMENT_LABELS }),
    );
  });

  it("PR-013 sin perfil pide completarlo primero", () => {
    hooks.profile = null;
    renderWithProviders(<VerificationWizard />);
    expect(screen.getByText("Primero completa tu perfil")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Completar perfil" })).toHaveAttribute(
      "href",
      "/panel/proveedor/perfil",
    );
  });

  it("PR-015 muestra el estado verificado", () => {
    hooks.profile = {
      legalName: "X",
      rut: "1",
      phone: "",
      email: "",
      verificationStatus: "verificado",
    };
    renderWithProviders(<VerificationWizard />);
    expect(screen.getByText("Empresa verificada")).toBeInTheDocument();
  });
});
