import { afterEach, describe, expect, it, vi } from "vitest";
import { answerQuestion } from "./ai";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("answerQuestion sin GEMINI_API_KEY", () => {
  it("devuelve una respuesta stub en español con sources vacío", async () => {
    const result = await answerQuestion({ message: "¿Quién instala split en La Florida?" });

    expect(result.stub).toBe(true);
    expect(result.sources).toEqual([]);
    expect(result.answer).toContain("E2/E3");
    expect(result.answer).toContain("buscador");
  });
});

describe("answerQuestion con GEMINI_API_KEY configurada", () => {
  it("sigue en modo stub mientras el módulo RAG no esté implementado", async () => {
    vi.resetModules();
    vi.stubEnv("GEMINI_API_KEY", "test-key");

    const mod = await import("./ai");
    const result = await mod.answerQuestion({ message: "hola" });

    expect(result.stub).toBe(true);
    expect(result.sources).toEqual([]);
    expect(result.answer).toContain("E3");
  });
});
