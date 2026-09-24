import { describe, it, expect, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import LoginPage from "./LoginPage";

beforeEach(() => {
  window.localStorage.clear();
});

describe("LoginPage", () => {
  it("renderiza el formulario de ingreso", () => {
    renderWithProviders(<LoginPage />, { route: "/ingresar" });

    expect(screen.getByRole("heading", { name: "Bienvenido de vuelta" })).toBeInTheDocument();
    expect(screen.getByLabelText("Correo electronico")).toBeInTheDocument();
    expect(screen.getByLabelText("Contrasena")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ingresar" })).toBeInTheDocument();
  });
});
