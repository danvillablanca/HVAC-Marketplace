import type { ReactElement } from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { Route, Routes } from "react-router-dom";
import { renderWithProviders, screen } from "@/test/render";
import ClientRequestsPage from "./ClientRequestsPage";

const ROUTE = "/panel/solicitudes";
const SESSION_KEY = "hvac-auth-session";

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

describe("ClientRequestsPage", () => {
  it("renderiza la página para un cliente autenticado", () => {
    window.localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        id: "u-cliente",
        email: "cliente@demo.cl",
        fullName: "Cliente Demo",
        role: "cliente",
      }),
    );

    renderAt(<ClientRequestsPage />);

    expect(screen.getByText(/Hola/)).toBeInTheDocument();
    expect(screen.getByText(/Nueva solicitud/)).toBeInTheDocument();
  });

  it("redirige a ingreso cuando no hay sesion", () => {
    renderAt(<ClientRequestsPage />);

    expect(screen.getByText("PANTALLA DE INGRESO")).toBeInTheDocument();
  });
});
