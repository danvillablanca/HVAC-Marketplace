import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import ChatPage from "./ChatPage";

beforeEach(() => {
  window.localStorage.clear();
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ChatPage", () => {
  it("renderiza el asistente y sus sugerencias", () => {
    renderWithProviders(<ChatPage />, { route: "/chat" });

    expect(screen.getByRole("heading", { name: "Asistente HVAC" })).toBeInTheDocument();
    expect(screen.getByLabelText("Escribe tu consulta")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Necesito instalar un aire acondicionado split/ }),
    ).toBeInTheDocument();
  });
});
