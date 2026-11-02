import { describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { RequireRole } from "./require-role";

vi.mock("./auth-context", () => ({
  useAuth: () => ({
    user: { id: "g", email: "g@gmail.com", fullName: "G", role: "cliente", needsRole: true },
    role: "cliente",
    loading: false,
  }),
}));

describe("RequireRole con OAuth", () => {
  it("PR-006 envia a /elegir-rol si el usuario aun no elige rol", () => {
    render(
      <MemoryRouter initialEntries={["/panel/solicitudes"]}>
        <Routes>
          <Route
            path="/panel/solicitudes"
            element={
              <RequireRole roles={["cliente"]}>
                <div>PANEL</div>
              </RequireRole>
            }
          />
          <Route path="/elegir-rol" element={<div>ELEGIR ROL</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("ELEGIR ROL")).toBeInTheDocument();
    expect(screen.queryByText("PANEL")).not.toBeInTheDocument();
  });
});
