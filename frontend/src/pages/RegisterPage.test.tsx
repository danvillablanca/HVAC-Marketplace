import { describe, it, expect, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import RegisterPage from "./RegisterPage";

beforeEach(() => {
  window.localStorage.clear();
});

describe("RegisterPage", () => {
  it("renderiza el formulario de registro con seleccion de rol", () => {
    renderWithProviders(<RegisterPage />, { route: "/registro" });

    expect(screen.getByRole("heading", { name: "Crea tu cuenta" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre completo")).toBeInTheDocument();
    expect(screen.getByLabelText("Tipo de cuenta")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Crear cuenta" })).toBeInTheDocument();
  });
});
