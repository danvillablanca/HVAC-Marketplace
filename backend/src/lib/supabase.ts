import { createClient } from "@supabase/supabase-js";
import { env, hasSupabase } from "./env";

// Los tipos de la base de datos se generan con `pnpm db:types`. Hasta entonces
// tipamos el cliente de forma laxa para no acoplar los servicios al esquema.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = any;

let serviceClient: Client | null = null;
let anonClient: Client | null = null;

export function getServiceClient(): Client | null {
  if (!hasSupabase || !env.supabaseServiceRoleKey) return null;
  if (!serviceClient) {
    serviceClient = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return serviceClient;
}

export function getAnonClient(): Client | null {
  if (!env.supabaseUrl || !env.supabaseAnonKey) return null;
  if (!anonClient) {
    anonClient = createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return anonClient;
}
