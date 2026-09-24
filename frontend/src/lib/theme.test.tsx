import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderWithProviders, render, screen, userEvent, waitFor } from "@/test/render";
import { useTheme } from "./theme";

function ThemeProbe() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button onClick={toggleTheme}>toggle</button>
      <button onClick={() => setTheme("dark")}>set-dark</button>
      <button onClick={() => setTheme("light")}>set-light</button>
      <button onClick={() => setTheme("system")}>set-system</button>
    </div>
  );
}

describe("lib/theme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    vi.unstubAllGlobals();
  });

  describe("ThemeProvider + useTheme", () => {
    it("arranca en claro y no aplica la clase dark", () => {
      renderWithProviders(<ThemeProbe />);

      expect(screen.getByTestId("theme")).toHaveTextContent("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("toggleTheme alterna el tema y la clase dark en <html>", async () => {
      const user = userEvent.setup();
      renderWithProviders(<ThemeProbe />);

      await user.click(screen.getByRole("button", { name: "toggle" }));
      expect(screen.getByTestId("theme")).toHaveTextContent("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(localStorage.getItem("hvac-theme")).toBe("dark");

      await user.click(screen.getByRole("button", { name: "toggle" }));
      expect(screen.getByTestId("theme")).toHaveTextContent("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
      expect(localStorage.getItem("hvac-theme")).toBe("light");
    });

    it("setTheme('dark') aplica y setTheme('light') quita la clase", async () => {
      const user = userEvent.setup();
      renderWithProviders(<ThemeProbe />);

      await user.click(screen.getByRole("button", { name: "set-dark" }));
      expect(document.documentElement.classList.contains("dark")).toBe(true);

      await user.click(screen.getByRole("button", { name: "set-light" }));
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("respeta el tema guardado en localStorage al montar", () => {
      localStorage.setItem("hvac-theme", "dark");

      renderWithProviders(<ThemeProbe />);

      expect(screen.getByTestId("theme")).toHaveTextContent("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("resuelve 'system' usando prefers-color-scheme", async () => {
      vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({
          matches: true,
          media: "(prefers-color-scheme: dark)",
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      );
      const user = userEvent.setup();
      renderWithProviders(<ThemeProbe />);

      await user.click(screen.getByRole("button", { name: "set-system" }));

      await waitFor(() => expect(screen.getByTestId("resolved")).toHaveTextContent("dark"));
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("useTheme lanza si se usa fuera de ThemeProvider", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      expect(() => render(<ThemeProbe />)).toThrow(/ThemeProvider/);
      spy.mockRestore();
    });
  });
});
