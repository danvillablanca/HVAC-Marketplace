import type { ReactElement } from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { Route, Routes } from "react-router-dom";
import { renderWithProviders, screen } from "@/test/render";
import ProviderPanelPage from "./ProviderPanelPage";

const ROUTE = "/panel/proveedor";
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

describe("ProviderPanelPage", () => {
  it("renderiza el panel del proveedor autenticado", () => {
    window.localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        id: "u-proveedor",
        email: "proveedor@demo.cl",
        fullName: "Proveedor Demo",
        role: "proveedor",
      }),
    );

    renderAt(<ProviderPanelPage />);

    expect(screen.getByText("Solicitudes recientes")).toBeInTheDocument();
  });

  it("redirige a ingreso cuando no hay sesion", () => {
    renderAt(<ProviderPanelPage />);

    expect(screen.getByText("PANTALLA DE INGRESO")).toBeInTheDocument();
    expect(screen.queryByText("Solicitudes recientes")).not.toBeInTheDocument();
  });
});
