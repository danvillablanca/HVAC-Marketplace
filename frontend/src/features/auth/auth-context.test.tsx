import { useState } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, renderWithProviders, screen, waitFor, userEvent } from "@/test/render";
import { AuthProvider, useAuth } from "./auth-context";

const SESSION_KEY = "hvac-auth-session";

/**
 * Sonda que expone el contexto de autenticacion mediante el DOM para
 * poder asertar el estado sin acoplarnos a internals del provider.
 */
function Probe() {
  const { user, role, loading, signIn, signOut } = useAuth();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <span data-testid="loading">{loading ? "loading" : "ready"}</span>
      <span data-testid="email">{user?.email ?? "anon"}</span>
      <span data-testid="role">{role ?? "none"}</span>
      <button
        type="button"
        onClick={() => {
          void signIn("cliente@demo.cl", "demo1234").catch(() => {});
        }}
      >
        ingresar
      </button>
      <button
        type="button"
        onClick={() => {
          void signIn("cliente@demo.cl", "clave-mala").catch((cause) => {
            setError((cause as Error).message);
          });
        }}
      >
        fallar
      </button>
      <button
        type="button"
        onClick={() => {
          void signOut();
        }}
      >
        salir
      </button>
      {error && <span role="alert">{error}</span>}
    </div>
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AuthProvider (modo demo)", () => {
  it("inicia sin sesion y con loading resuelto", () => {
    renderWithProviders(<Probe />);

    expect(screen.getByTestId("loading")).toHaveTextContent("ready");
    expect(screen.getByTestId("email")).toHaveTextContent("anon");
    expect(screen.getByTestId("role")).toHaveTextContent("none");
  });

  it("signIn con una cuenta demo setea user/role y persiste la sesion", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Probe />);

    await user.click(screen.getByRole("button", { name: "ingresar" }));

    await waitFor(() => expect(screen.getByTestId("email")).toHaveTextContent("cliente@demo.cl"));
    expect(screen.getByTestId("role")).toHaveTextContent("cliente");
    expect(window.localStorage.getItem(SESSION_KEY)).toContain("cliente@demo.cl");
  });

  it("signIn con credenciales invalidas lanza error y no crea sesion", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Probe />);

    await user.click(screen.getByRole("button", { name: "fallar" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/Correo o contrasena incorrectos/),
    );
    expect(screen.getByTestId("email")).toHaveTextContent("anon");
    expect(window.localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it("signOut limpia el usuario y la sesion persistida", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Probe />);

    await user.click(screen.getByRole("button", { name: "ingresar" }));
    await waitFor(() => expect(screen.getByTestId("email")).toHaveTextContent("cliente@demo.cl"));

    await user.click(screen.getByRole("button", { name: "salir" }));

    await waitFor(() => expect(screen.getByTestId("email")).toHaveTextContent("anon"));
    expect(screen.getByTestId("role")).toHaveTextContent("none");
    expect(window.localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it("restaura la sesion persistida al montar", () => {
    window.localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        id: "u-1",
        email: "proveedor@demo.cl",
        fullName: "Proveedor Persistido",
        role: "proveedor",
      }),
    );

    renderWithProviders(<Probe />);

    expect(screen.getByTestId("email")).toHaveTextContent("proveedor@demo.cl");
    expect(screen.getByTestId("role")).toHaveTextContent("proveedor");
  });
});

describe("useAuth", () => {
  it("lanza error si se usa fuera de <AuthProvider>", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<Probe />)).toThrow(/useAuth debe usarse dentro de <AuthProvider>/);

    consoleError.mockRestore();
  });

  it("expone correctamente el provider", () => {
    renderWithProviders(<Probe />);
    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });

  it("AuthProvider renderiza sus hijos", () => {
    render(<AuthProvider>{<span>contenido hijo</span>}</AuthProvider>);
    expect(screen.getByText("contenido hijo")).toBeInTheDocument();
  });
});
