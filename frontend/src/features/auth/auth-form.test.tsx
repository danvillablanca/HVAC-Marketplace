import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen, waitFor, userEvent } from "@/test/render";
import { AuthForm } from "./auth-form";

const authMocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/features/auth/auth-context", () => ({
  AuthProvider: ({ children }: { children?: ReactNode }) => <>{children}</>,
  useAuth: authMocks.useAuth,
}));

beforeEach(() => {
  window.localStorage.clear();
  authMocks.signIn.mockReset().mockResolvedValue(undefined);
  authMocks.signUp.mockReset().mockResolvedValue(undefined);
  authMocks.signOut.mockReset().mockResolvedValue(undefined);
  authMocks.useAuth.mockReset().mockReturnValue({
    user: null,
    role: null,
    loading: false,
    signIn: authMocks.signIn,
    signUp: authMocks.signUp,
    signOut: authMocks.signOut,
  });
});

describe("AuthForm (login)", () => {
  it("exige email y contrasena validos antes de autenticar", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthForm mode="login" />);

    await user.click(screen.getByRole("button", { name: "Ingresar" }));

    expect(await screen.findByText("Correo invalido")).toBeInTheDocument();
    expect(screen.getByText("Ingresa tu contrasena")).toBeInTheDocument();
    expect(authMocks.signIn).not.toHaveBeenCalled();
  });

  it("rechaza un email con formato invalido", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthForm mode="login" />);

    await user.type(screen.getByLabelText("Correo electronico"), "no-es-correo");
    await user.type(screen.getByLabelText("Contrasena"), "secreto1");
    await user.click(screen.getByRole("button", { name: "Ingresar" }));

    expect(await screen.findByText("Correo invalido")).toBeInTheDocument();
    expect(authMocks.signIn).not.toHaveBeenCalled();
  });

  it("invoca signIn con credenciales validas", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthForm mode="login" />);

    await user.type(screen.getByLabelText("Correo electronico"), "cliente@demo.cl");
    await user.type(screen.getByLabelText("Contrasena"), "demo1234");
    await user.click(screen.getByRole("button", { name: "Ingresar" }));

    await waitFor(() =>
      expect(authMocks.signIn).toHaveBeenCalledWith("cliente@demo.cl", "demo1234"),
    );
  });

  it("muestra el error de autenticacion cuando signIn falla", async () => {
    authMocks.signIn.mockRejectedValueOnce(
      new Error("Correo o contrasena incorrectos. En modo demo usa cliente@demo.cl / demo1234."),
    );
    const user = userEvent.setup();
    renderWithProviders(<AuthForm mode="login" />);

    await user.type(screen.getByLabelText("Correo electronico"), "cliente@demo.cl");
    await user.type(screen.getByLabelText("Contrasena"), "clave-mala");
    await user.click(screen.getByRole("button", { name: "Ingresar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Correo o contrasena incorrectos/);
  });
});

describe("AuthForm (registro)", () => {
  it("exige nombre, email y contrasena y ofrece la seleccion de rol", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthForm mode="register" />);

    expect(screen.getByLabelText("Tipo de cuenta")).toHaveValue("cliente");

    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(await screen.findByText("Nombre demasiado corto")).toBeInTheDocument();
    expect(screen.getByText("Correo invalido")).toBeInTheDocument();
    expect(screen.getByText("Minimo 8 caracteres")).toBeInTheDocument();
    expect(authMocks.signUp).not.toHaveBeenCalled();
  });

  it("valida RUT y telefono cuando el rol es proveedor", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthForm mode="register" />);

    await user.selectOptions(screen.getByLabelText("Tipo de cuenta"), "proveedor");
    expect(screen.getByLabelText("RUT de la empresa")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Nombre completo"), "Empresa Test SpA");
    await user.type(screen.getByLabelText("Correo electronico"), "proveedor@test.cl");
    await user.type(screen.getByLabelText("Contrasena"), "password1");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(await screen.findByText("RUT chileno invalido")).toBeInTheDocument();
    expect(screen.getByText("Telefono demasiado corto")).toBeInTheDocument();
    expect(authMocks.signUp).not.toHaveBeenCalled();
  });

  it("valida el RUT chileno del proveedor", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthForm mode="register" />);

    await user.selectOptions(screen.getByLabelText("Tipo de cuenta"), "proveedor");
    await user.type(screen.getByLabelText("Nombre completo"), "Empresa Test SpA");
    await user.type(screen.getByLabelText("Correo electronico"), "proveedor@test.cl");
    await user.type(screen.getByLabelText("Contrasena"), "password1");
    await user.type(screen.getByLabelText("RUT de la empresa"), "12.345.678-9");
    await user.type(screen.getByLabelText("Telefono"), "+56 9 1234 5678");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(await screen.findByText("RUT chileno invalido")).toBeInTheDocument();
    expect(authMocks.signUp).not.toHaveBeenCalled();
  });

  it("invoca signUp con los datos normalizados del proveedor", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthForm mode="register" />);

    await user.selectOptions(screen.getByLabelText("Tipo de cuenta"), "proveedor");
    await user.type(screen.getByLabelText("Nombre completo"), "Empresa Test SpA");
    await user.type(screen.getByLabelText("Correo electronico"), "Proveedor@Test.CL");
    await user.type(screen.getByLabelText("Contrasena"), "password1");
    await user.type(screen.getByLabelText("RUT de la empresa"), "12.345.678-5");
    await user.type(screen.getByLabelText("Telefono"), "+56 9 1234 5678");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => expect(authMocks.signUp).toHaveBeenCalledTimes(1));
    expect(authMocks.signUp).toHaveBeenCalledWith({
      email: "proveedor@test.cl",
      password: "password1",
      fullName: "Empresa Test SpA",
      role: "proveedor",
      rut: "123456785",
      phone: "+56912345678",
    });
  });

  it("invoca signUp como cliente sin RUT ni telefono", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthForm mode="register" />);

    await user.type(screen.getByLabelText("Nombre completo"), "Cliente Demo Sur");
    await user.type(screen.getByLabelText("Correo electronico"), "cliente@test.cl");
    await user.type(screen.getByLabelText("Contrasena"), "password1");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => expect(authMocks.signUp).toHaveBeenCalledTimes(1));
    const payload = authMocks.signUp.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload).toMatchObject({
      email: "cliente@test.cl",
      fullName: "Cliente Demo Sur",
      role: "cliente",
    });
    expect(payload.rut).toBeUndefined();
    expect(payload.phone).toBeUndefined();
  });
});
