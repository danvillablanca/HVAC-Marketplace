export const env = {
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiChatModel: process.env.GEMINI_CHAT_MODEL ?? "gemini-2.5-flash",
  geminiEmbeddingModel: process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-001",
  geminiEmbeddingDim: Number(process.env.GEMINI_EMBEDDING_DIM ?? 1536),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
} as const;

export const hasSupabase = Boolean(
  env.supabaseUrl && env.supabaseAnonKey && env.supabaseServiceRoleKey,
);

export const hasGemini = Boolean(env.geminiApiKey);
