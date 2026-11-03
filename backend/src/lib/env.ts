/** Los valores de ejemplo de .env.example ("your-...") cuentan como no configurados. */
const real = (value: string | undefined) => (value && !value.startsWith("your-") ? value : "");

export const env = {
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseAnonKey: real(process.env.SUPABASE_ANON_KEY),
  supabaseServiceRoleKey: real(process.env.SUPABASE_SERVICE_ROLE_KEY),
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  /** NOT-02: correos transaccionales con Resend (opcional). */
  resendApiKey: real(process.env.RESEND_API_KEY),
  emailFrom: process.env.EMAIL_FROM ?? "HVAC Connect <onboarding@resend.dev>",
  geminiChatModel: process.env.GEMINI_CHAT_MODEL ?? "gemini-2.5-flash",
  geminiEmbeddingModel: process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-001",
  geminiEmbeddingDim: Number(process.env.GEMINI_EMBEDDING_DIM ?? 1536),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
  demoMode: process.env.DEMO_MODE === "true",
} as const;

export const hasSupabase = Boolean(
  env.supabaseUrl && env.supabaseAnonKey && env.supabaseServiceRoleKey,
);

export const hasGemini = Boolean(env.geminiApiKey);

export const isDemoMode = env.demoMode;
