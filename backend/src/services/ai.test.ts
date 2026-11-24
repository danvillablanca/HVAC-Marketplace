import { afterEach, describe, expect, it, vi } from "vitest";
import { answerQuestion } from "./ai";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("PR-035 answerQuestion sin GEMINI_API_KEY (IA-01, reglas)", () => {
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

describe("PR-035 answerQuestion con GEMINI_API_KEY configurada (IA-01, fallback)", () => {
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

describe("PR-035 answerQuestion con Gemini (IA-01)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("devuelve la respuesta de Gemini, sin partes de razonamiento, con el modelo configurado", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubEnv("GEMINI_CHAT_MODEL", "gemini-3.5-flash-lite");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                { text: "pensando...", thought: true },
                { text: "Necesitas un servicio de instalación de split." },
              ],
            },
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const mod = await import("./ai");
    const result = await mod.answerQuestion({ message: "instalar split" }, "gemini-user");
    expect(result).toEqual({
      answer: "Necesitas un servicio de instalación de split.",
      sources: ["gemini-ai"],
      stub: false,
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("models/gemini-3.5-flash-lite:generateContent");
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("si Gemini se demora o falla, responde con las reglas", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("timeout", "TimeoutError")));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const mod = await import("./ai");
    const result = await mod.answerQuestion({ message: "Mi equipo no enfría" }, "timeout-user");
    expect(result.answer).toContain("filtro");
  });
});

describe("PR-038 límite diario del asistente (IA-04)", () => {
  it("permite 20 consultas al día por usuario y la 21 responde 429", async () => {
    const mod = await import("./ai");
    for (let i = 0; i < mod.AI_DAILY_LIMIT; i += 1) {
      await mod.answerQuestion({ message: "hola" }, "limit-user");
    }
    await expect(mod.answerQuestion({ message: "hola" }, "limit-user")).rejects.toMatchObject({
      status: 429,
      code: "rate_limited",
    });
    // Otro usuario no se ve afectado.
    await expect(mod.answerQuestion({ message: "hola" }, "otro-user")).resolves.toBeTruthy();
  });
});
