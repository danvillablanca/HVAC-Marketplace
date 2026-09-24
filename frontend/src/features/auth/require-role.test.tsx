import { describe, it, expect, beforeEach } from "vitest";
import { Route, Routes } from "react-router-dom";
import type { UserRole } from "@hvac/shared";
import { renderWithProviders, screen } from "@/test/render";
import { RequireRole } from "./require-role";

const SESSION_KEY = "hvac-auth-session";

function seedSession(role: UserRole) {
  window.localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      id: `u-${role}`,
      email: `${role}@demo.cl`,
      fullName: "Usuario de Prueba",
      role,
    }),
  );
}

function Scene({ roles }: { roles: UserRole[] }) {
  return (
    <Routes>
      <Route
        path="/privado"
        element={
          <RequireRole roles={roles}>
            <div>CONTENIDO PRIVADO</div>
          </RequireRole>
        }
      />
      <Route path="/ingresar" element={<div>PANTALLA DE INGRESO</div>} />
    </Routes>
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("RequireRole", () => {
  it("redirige a /ingresar cuando no hay sesion", () => {
    renderWithProviders(<Scene roles={["cliente"]} />, { route: "/privado" });

    expect(screen.getByText("PANTALLA DE INGRESO")).toBeInTheDocument();
    expect(screen.queryByText("CONTENIDO PRIVADO")).not.toBeInTheDocument();
  });

  it("renderiza los children cuando el rol coincide", () => {
    seedSession("cliente");
    renderWithProviders(<Scene roles={["cliente"]} />, { route: "/privado" });

    expect(screen.getByText("CONTENIDO PRIVADO")).toBeInTheDocument();
    expect(screen.queryByText("PANTALLA DE INGRESO")).not.toBeInTheDocument();
  });

  it("redirige cuando el rol no esta permitido", () => {
    seedSession("cliente");
    renderWithProviders(<Scene roles={["admin"]} />, { route: "/privado" });

    expect(screen.getByText("PANTALLA DE INGRESO")).toBeInTheDocument();
    expect(screen.queryByText("CONTENIDO PRIVADO")).not.toBeInTheDocument();
  });

  it("admite varios roles permitidos", () => {
    seedSession("admin");
    renderWithProviders(<Scene roles={["proveedor", "admin"]} />, { route: "/privado" });

    expect(screen.getByText("CONTENIDO PRIVADO")).toBeInTheDocument();
  });
});
