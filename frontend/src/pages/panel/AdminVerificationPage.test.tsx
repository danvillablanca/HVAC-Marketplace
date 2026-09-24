import type { ReactElement } from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { Route, Routes } from "react-router-dom";
import type { UserRole } from "@hvac/shared";
import { renderWithProviders, screen } from "@/test/render";
import AdminVerificationPage from "./AdminVerificationPage";

const ROUTE = "/panel/admin/verificaciones";
const SESSION_KEY = "hvac-auth-session";

function seedSession(role: UserRole) {
  window.localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ id: "u", email: `${role}@demo.cl`, fullName: "Admin Demo", role }),
  );
}

function renderAt(element: ReactElement) {
  return renderWithProviders(
    <Routes>
      <Route path={ROUTE} element={element} />
      <Route path="/ingresar" element={<div>PANTALLA DE INGRESO</div>} />
    </Routes>,
    { route: ROUTE },
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("AdminVerificationPage", () => {
  it("renderiza la bandeja para un admin autenticado", () => {
    seedSession("admin");
    renderAt(<AdminVerificationPage />);

    expect(screen.getByText("Bandeja de verificacion")).toBeInTheDocument();
  });

  it("redirige a ingreso cuando no hay sesion", () => {
    renderAt(<AdminVerificationPage />);

    expect(screen.getByText("PANTALLA DE INGRESO")).toBeInTheDocument();
    expect(screen.queryByText("Bandeja de verificacion")).not.toBeInTheDocument();
  });
});
