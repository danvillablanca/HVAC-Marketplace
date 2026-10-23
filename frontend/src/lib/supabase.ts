import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, hasSupabaseConfig } from "./env";

/**
 * Cliente Supabase para el navegador.
 * Devuelve null si no hay configuracion local (permite usar datos demo).
 */
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!hasSupabaseConfig) return null;
  if (!client) {
    client = createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return client;
}
