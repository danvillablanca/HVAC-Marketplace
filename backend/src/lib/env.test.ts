import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function loadEnv() {
  vi.resetModules();
  return import("./env");
}

describe("env", () => {
  it("usa valores por defecto cuando no hay variables de entorno", async () => {
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_ANON_KEY", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("GEMINI_CHAT_MODEL", undefined);
    vi.stubEnv("GEMINI_EMBEDDING_MODEL", undefined);
    vi.stubEnv("GEMINI_EMBEDDING_DIM", undefined);
    vi.stubEnv("FRONTEND_ORIGIN", undefined);

    const { env, hasSupabase, hasGemini } = await loadEnv();

    expect(env.supabaseUrl).toBe("");
    expect(env.supabaseAnonKey).toBe("");
    expect(env.supabaseServiceRoleKey).toBe("");
    expect(env.geminiApiKey).toBe("");
    expect(env.geminiChatModel).toBe("gemini-2.5-flash");
    expect(env.geminiEmbeddingModel).toBe("gemini-embedding-001");
    expect(env.geminiEmbeddingDim).toBe(1536);
    expect(env.frontendOrigin).toBe("http://localhost:5173");
    expect(hasSupabase).toBe(false);
    expect(hasGemini).toBe(false);
  });

  it("detecta la configuración y respeta los overrides", async () => {
    vi.stubEnv("SUPABASE_URL", "https://demo.supabase.co");
    vi.stubEnv("SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
    vi.stubEnv("GEMINI_API_KEY", "gemini-key");
    vi.stubEnv("GEMINI_CHAT_MODEL", "gemini-custom");
    vi.stubEnv("GEMINI_EMBEDDING_DIM", "2048");
    vi.stubEnv("FRONTEND_ORIGIN", "https://app.example");

    const { env, hasSupabase, hasGemini } = await loadEnv();

    expect(hasSupabase).toBe(true);
    expect(hasGemini).toBe(true);
    expect(env.supabaseUrl).toBe("https://demo.supabase.co");
    expect(env.geminiChatModel).toBe("gemini-custom");
    expect(env.geminiEmbeddingDim).toBe(2048);
    expect(env.frontendOrigin).toBe("https://app.example");
  });

  it("hasSupabase requiere las tres claves", async () => {
    vi.stubEnv("SUPABASE_URL", "https://demo.supabase.co");
    vi.stubEnv("SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    const { hasSupabase } = await loadEnv();

    expect(hasSupabase).toBe(false);
  });
});
