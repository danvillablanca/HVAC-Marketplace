import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "@hvac/shared";
import { env, hasSupabase } from "./env";
import { HttpError } from "./http";

/** Datos del usuario autenticado extraídos del JWT. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}

const isDemoMode = process.env.DEMO_MODE === "true";

/**
 * Extrae y valida el Bearer JWT del header Authorization.
 * Devuelve el usuario autenticado con su rol desde `profiles`.
 * Lanza 401 si no hay token o es inválido, 403 si faltan roles.
 */
export async function requireUser(req: Request): Promise<AuthenticatedUser> {
  const authorization = req.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;

  if (!token) {
    throw new HttpError("unauthorized", "Se requiere autenticación", 401);
  }

  if (!hasSupabase) {
    if (isDemoMode) {
      // En modo demo el token es el JSON del usuario demo
      try {
        const parsed = JSON.parse(atob(token)) as Partial<AuthenticatedUser>;
        if (parsed.id && parsed.role) {
          return {
            id: parsed.id,
            email: parsed.email ?? "",
            role: parsed.role,
          };
        }
      } catch {
        // no parseable, fall through
      }
    }
    throw new HttpError("unauthorized", "Supabase no está configurado y el token es inválido", 401);
  }

  // Crear cliente con el JWT del usuario para que RLS aplique
  const userClient = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
    error,
  } = await userClient.auth.getUser(token);

  if (error || !user) {
    throw new HttpError("unauthorized", "Token inválido o expirado", 401);
  }

  // Obtener el rol desde profiles
  const { data: profile } = await userClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role: UserRole = profile?.role ?? (user.user_metadata?.role as UserRole) ?? "cliente";

  return {
    id: user.id,
    email: user.email ?? "",
    role,
  };
}

/**
 * Requiere que el usuario autenticado tenga uno de los roles especificados.
 * Lanza 403 si el rol no coincide.
 */
export async function requireRole(req: Request, roles: UserRole[]): Promise<AuthenticatedUser> {
  const user = await requireUser(req);
  if (!roles.includes(user.role)) {
    throw new HttpError("forbidden", `Acceso denegado. Se requiere rol: ${roles.join(", ")}`, 403);
  }
  return user;
}

/**
 * Crea un cliente Supabase que opera con el JWT del usuario,
 * para que las políticas RLS apliquen correctamente.
 */
export function getUserClient(token: string): SupabaseClient | null {
  if (!hasSupabase) return null;
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

/** Extrae el token Bearer de la request, o null si no hay. */
export function extractToken(req: Request): string | null {
  const authorization = req.headers.get("authorization");
  return authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
}
