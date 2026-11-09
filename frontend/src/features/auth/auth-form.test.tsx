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
    await user.click(screen.getByRole("checkbox"));
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
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => expect(authMocks.signUp).toHaveBeenCalledTimes(1));
    expect(authMocks.signUp).toHaveBeenCalledWith({
      email: "proveedor@test.cl",
      password: "password1",
      fullName: "Empresa Test SpA",
      role: "proveedor",
      rut: "123456785",
      phone: "+56912345678",
      acceptTerms: true,
    });
  });

  it("invoca signUp como cliente sin RUT ni telefono", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthForm mode="register" />);

    await user.type(screen.getByLabelText("Nombre completo"), "Cliente Demo Sur");
    await user.type(screen.getByLabelText("Correo electronico"), "cliente@test.cl");
    await user.type(screen.getByLabelText("Contrasena"), "password1");
    await user.click(screen.getByRole("checkbox"));
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

describe("AuthForm (cuentas, Bloque B)", () => {
  it("PR-001 no registra sin aceptar terminos y privacidad", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthForm mode="register" />);

    await user.type(screen.getByLabelText("Nombre completo"), "Cliente Sin Terminos");
    await user.type(screen.getByLabelText("Correo electronico"), "sinterminos@test.cl");
    await user.type(screen.getByLabelText("Contrasena"), "password1");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(await screen.findByText(/Debes aceptar los terminos/)).toBeInTheDocument();
    expect(authMocks.signUp).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Términos y condiciones" })).toHaveAttribute(
      "href",
      "/terminos",
    );
    expect(screen.getByRole("link", { name: "Política de privacidad" })).toHaveAttribute(
      "href",
      "/privacidad",
    );
  });

  it("PR-001 RN-01 el selector de rol no ofrece admin", () => {
    renderWithProviders(<AuthForm mode="register" />);
    const options = Array.from(
      (screen.getByLabelText("Tipo de cuenta") as HTMLSelectElement).options,
    ).map((o) => o.value);
    expect(options).toEqual(["cliente", "proveedor"]);
  });

  it("PR-003 el login enlaza a la recuperacion de contrasena", () => {
    renderWithProviders(<AuthForm mode="login" />);
    expect(screen.getByRole("link", { name: "¿Olvidaste tu contraseña?" })).toHaveAttribute(
      "href",
      "/recuperar",
    );
  });

  it("PR-006 oculta Google si no esta configurado y lo muestra si lo esta", async () => {
    const { unmount } = renderWithProviders(<AuthForm mode="login" />);
    expect(screen.queryByRole("button", { name: "Continuar con Google" })).not.toBeInTheDocument();
    unmount();

    const signInWithGoogle = vi.fn().mockResolvedValue(undefined);
    authMocks.useAuth.mockReturnValue({
      ...authMocks.useAuth(),
      googleEnabled: true,
      signInWithGoogle,
    });
    const user = userEvent.setup();
    renderWithProviders(<AuthForm mode="login" />);
    await user.click(screen.getByRole("button", { name: "Continuar con Google" }));
    expect(signInWithGoogle).toHaveBeenCalledTimes(1);
  });

  it("con confirmacion de correo activa muestra 'Revisa tu correo'", async () => {
    authMocks.signUp.mockResolvedValue("confirm_email");
    const user = userEvent.setup();
    renderWithProviders(<AuthForm mode="register" />);
    await user.type(screen.getByLabelText("Nombre completo"), "Cliente Nube");
    await user.type(screen.getByLabelText("Correo electronico"), "nube@test.cl");
    await user.type(screen.getByLabelText("Contrasena"), "password1");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));
    expect(await screen.findByText("Revisa tu correo")).toBeInTheDocument();
    expect(screen.getByText("nube@test.cl")).toBeInTheDocument();
  });
});
