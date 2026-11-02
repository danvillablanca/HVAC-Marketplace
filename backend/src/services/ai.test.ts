import { afterEach, describe, expect, it, vi } from "vitest";
import { answerQuestion } from "./ai";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("answerQuestion sin GEMINI_API_KEY", () => {
  it("devuelve respuesta de diagnóstico basada en reglas para 'no enfría'", async () => {
    const result = await answerQuestion(
      { message: "Mi aire acondicionado no enfría bien" },
      "test-user",
    );
    expect(result.stub).toBe(false);
    expect(result.answer).toContain("filtro");
    expect(result.sources.length).toBeGreaterThan(0);
  });

  it("devuelve respuesta sobre mantención", async () => {
    const result = await answerQuestion(
      { message: "¿Cada cuánto debo hacer mantención?" },
      "test-user",
    );
    expect(result.stub).toBe(false);
    expect(result.answer).toContain("mantención");
  });

  it("devuelve respuesta sobre costos", async () => {
    const result = await answerQuestion(
      { message: "¿Cuál es el precio de reparar un aire?" },
      "test-user",
    );
    expect(result.stub).toBe(false);
    expect(result.answer).toContain("CLP");
  });

  it("devuelve respuesta sobre ruidos", async () => {
    const result = await answerQuestion({ message: "Mi equipo hace mucho ruido" }, "test-user");
    expect(result.stub).toBe(false);
    expect(result.answer).toContain("ruido");
  });

  it("devuelve respuesta genérica cuando no coincide ninguna regla", async () => {
    const result = await answerQuestion({ message: "hola" }, "test-user");
    expect(result.stub).toBe(false);
    expect(result.answer).toContain("Diagnóstico");
  });

  it("matchea correctamente con acentos y sin acentos", async () => {
    const result = await answerQuestion({ message: "instalacion de equipo" }, "test-user");
    expect(result.stub).toBe(false);
    expect(result.answer).toContain("BTU");
  });
});

describe("answerQuestion con GEMINI_API_KEY configurada", () => {
  it("intenta usar Gemini y cae a reglas si no hay red", async () => {
    vi.resetModules();
    vi.stubEnv("GEMINI_API_KEY", "test-key");

    const mod = await import("./ai");
    // In test environment, fetch to Gemini will fail, so it falls back to rules
    const result = await mod.answerQuestion({ message: "no enfría" }, "test-user");
    expect(result.stub).toBe(false);
    expect(result.answer).toBeTruthy();
  });
});
