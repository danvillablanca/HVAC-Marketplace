import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  USER_ROLES,
  lockoutMessage,
  lockoutMinutesLeft,
  type LoginAttempt,
  type RegisterInput,
  type UserRole,
} from "@hvac/shared";
import { getSupabase } from "@/lib/supabase";
import { env, isDemoMode } from "@/lib/env";
import { apiFetch } from "@/lib/api";

/** Usuario autenticado expuesto por el contexto. */
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  /** Primer ingreso con OAuth: falta elegir cliente o proveedor (REQ-AUT-06). */
  needsRole?: boolean;
}

export interface AuthContextValue {
  user: AuthUser | null;
  role: UserRole | null;
  loading: boolean;
  /** Hay login con Google configurado (REQ-AUT-06). */
  googleEnabled: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  /** "confirm_email": la cuenta se creo pero falta confirmar el correo (Supabase Cloud). */
  signUp: (input: RegisterInput) => Promise<"ok" | "confirm_email">;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  chooseRole: (role: "cliente" | "proveedor") => Promise<void>;
}

const SESSION_KEY = "hvac-auth-session";
const ACCOUNTS_KEY = "hvac-auth-accounts";
const ATTEMPTS_KEY = "hvac-auth-attempts";
const LAST_ACTIVITY_KEY = "hvac-last-activity";

/** REQ-AUT-05: la sesion expira tras 7 dias sin actividad. */
export const INACTIVITY_LIMIT_MS = 7 * 24 * 60 * 60 * 1000;
const ACTIVITY_THROTTLE_MS = 60 * 1000;

interface DemoAccount extends AuthUser {
  password: string;
  acceptedTermsAt?: string;
}

/**
 * Cuentas sembradas para el modo demo (sin Supabase configurado).
 * Solo se usan en desarrollo local; la contrasena es de juguete.
 */
const DEMO_SEED: DemoAccount[] = [
  {
    id: "demo-cliente",
    email: "cliente@demo.cl",
    password: "demo1234",
    fullName: "Cliente Demo",
    role: "cliente",
  },
  {
    id: "demo-proveedor",
    email: "proveedor@demo.cl",
    password: "demo1234",
    fullName: "Proveedor Demo",
    role: "proveedor",
  },
  {
    id: "demo-admin",
    email: "admin@demo.cl",
    password: "demo1234",
    fullName: "Admin ASHRAE",
    role: "admin",
  },
];

const AuthContext = createContext<AuthContextValue | null>(null);

function isRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // almacenamiento no disponible: la sesion vive solo en memoria
  }
}

function readAccounts(): DemoAccount[] {
  const stored = readJson<DemoAccount[]>(ACCOUNTS_KEY, []);
  const merged = new Map<string, DemoAccount>();
  for (const account of DEMO_SEED) merged.set(account.email, account);
  if (Array.isArray(stored)) {
    for (const account of stored) {
      if (account && typeof account.email === "string") merged.set(account.email, account);
    }
  }
  return [...merged.values()];
}

function readSession(): AuthUser | null {
  const parsed = readJson<Partial<AuthUser> | null>(SESSION_KEY, null);
  if (!parsed?.id || !parsed.email || !isRole(parsed.role)) return null;
  return {
    id: parsed.id,
    email: parsed.email,
    fullName: parsed.fullName ?? parsed.email,
    role: parsed.role,
  };
}

function touchActivity(): void {
  writeJson(LAST_ACTIVITY_KEY, Date.now());
}

/** true si la ultima actividad registrada supera el limite de inactividad. */
export function isSessionExpired(now = Date.now()): boolean {
  const last = readJson<number | null>(LAST_ACTIVITY_KEY, null);
  return typeof last === "number" && now - last > INACTIVITY_LIMIT_MS;
}

/** Control de intentos en modo demo; con Supabase lo aplica el backend. */
function demoLockout(email: string, success?: boolean): number {
  const all = readJson<Record<string, LoginAttempt[]>>(ATTEMPTS_KEY, {});
  const now = Date.now();
  if (success !== undefined) {
    all[email] = [...(all[email] ?? []), { success, createdAt: now }].slice(-20);
    writeJson(ATTEMPTS_KEY, all);
  }
  return lockoutMinutesLeft(all[email] ?? [], now);
}

function fallbackUser(user: User): AuthUser {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const name = meta.fullName ?? meta.full_name ?? meta.name;
  return {
    id: user.id,
    email: user.email ?? "",
    fullName: typeof name === "string" && name.trim() ? name : (user.email ?? "Usuario"),
    role: "cliente",
  };
}

/** El rol sale de `profiles` (RLS: solo el propio perfil), nunca de metadatos editables. */
async function loadProfile(supabase: SupabaseClient, user: User): Promise<AuthUser> {
  const base = fallbackUser(user);
  const { data } = await supabase
    .from("profiles")
    .select("role, full_name, needs_role")
    .eq("id", user.id)
    .maybeSingle();
  if (!data) return base;
  return {
    ...base,
    fullName: data.full_name || base.fullName,
    role: isRole(data.role) ? data.role : base.role,
    needsRole: Boolean(data.needs_role),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabase();
  const useDemoAuth = !supabase && isDemoMode;
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (!useDemoAuth) return null;
    if (isSessionExpired()) {
      writeJson(SESSION_KEY, null);
      return null;
    }
    return readSession();
  });
  const [loading, setLoading] = useState<boolean>(() => !useDemoAuth);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let active = true;
    const apply = async (sessionUser: User | null) => {
      if (!sessionUser) {
        if (active) setUser(null);
        return;
      }
      if (isSessionExpired()) {
        await supabase.auth.signOut();
        writeJson(LAST_ACTIVITY_KEY, null);
        if (active) setUser(null);
        return;
      }
      touchActivity();
      const profile = await loadProfile(supabase, sessionUser);
      if (active) setUser(profile);
    };
    supabase.auth
      .getSession()
      .then(({ data }) => apply(data.session?.user ?? null))
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      void apply(session?.user ?? null);
    });
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [supabase]);

  // REQ-AUT-05: registra actividad del usuario para la expiracion por inactividad.
  useEffect(() => {
    if (!user || typeof window === "undefined") return;
    let last = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now - last < ACTIVITY_THROTTLE_MS) return;
      last = now;
      touchActivity();
    };
    onActivity();
    window.addEventListener("pointerdown", onActivity);
    window.addEventListener("keydown", onActivity);
    return () => {
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
    };
  }, [user]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const normalized = email.trim().toLowerCase();
      if (!supabase) {
        if (!isDemoMode) {
          throw new Error("El servicio de autenticación no está disponible.");
        }
        const minutes = demoLockout(normalized);
        if (minutes > 0) throw new Error(lockoutMessage(minutes));
        const account = readAccounts().find(
          (candidate) => candidate.email === normalized && candidate.password === password,
        );
        if (!account) {
          demoLockout(normalized, false);
          throw new Error(
            "Correo o contraseña incorrectos. En modo demo usa cliente@demo.cl / demo1234.",
          );
        }
        demoLockout(normalized, true);
        const next: AuthUser = {
          id: account.id,
          email: account.email,
          fullName: account.fullName,
          role: account.role,
        };
        touchActivity();
        writeJson(SESSION_KEY, next);
        setUser(next);
        return;
      }
      // El backend aplica el bloqueo por intentos (REQ-AUT-02) y devuelve la sesion.
      const session = await apiFetch<{ accessToken: string; refreshToken: string }>(
        "/api/auth/login",
        { method: "POST", body: { email: normalized, password }, token: null },
      );
      const { data, error } = await supabase.auth.setSession({
        access_token: session.accessToken,
        refresh_token: session.refreshToken,
      });
      if (error || !data.user) throw new Error("No se pudo iniciar la sesión.");
      touchActivity();
      setUser(await loadProfile(supabase, data.user));
    },
    [supabase],
  );

  const signUp = useCallback(
    async (input: RegisterInput) => {
      const acceptedTermsAt = new Date().toISOString();
      if (!supabase) {
        if (!isDemoMode) {
          throw new Error("El servicio de autenticación no está disponible.");
        }
        const accounts = readAccounts();
        if (accounts.some((account) => account.email === input.email)) {
          throw new Error("Ya existe una cuenta con ese correo.");
        }
        const account: DemoAccount = {
          id: `demo-${input.role}-${Date.now()}`,
          email: input.email,
          fullName: input.fullName,
          role: input.role,
          password: input.password,
          acceptedTermsAt,
        };
        writeJson(ACCOUNTS_KEY, [...accounts, account]);
        const next: AuthUser = {
          id: account.id,
          email: account.email,
          fullName: account.fullName,
          role: account.role,
        };
        touchActivity();
        writeJson(SESSION_KEY, next);
        setUser(next);
        return "ok";
      }
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          emailRedirectTo: `${window.location.origin}/ingresar`,
          data: {
            fullName: input.fullName,
            role: input.role,
            rut: input.rut ?? null,
            phone: input.phone ?? null,
            acceptedTermsAt,
          },
        },
      });
      if (error) throw new Error(error.message);
      // Con confirmacion de correo activa (Supabase Cloud) no hay sesion hasta confirmar.
      if (!data.session) return "confirm_email";
      touchActivity();
      setUser(await loadProfile(supabase, data.session.user));
      return "ok";
    },
    [supabase],
  );

  const signInWithGoogle = useCallback(async () => {
    if (!supabase || !env.googleAuthEnabled) {
      throw new Error("El ingreso con Google no está disponible.");
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/ingresar` },
    });
    if (error) throw new Error(error.message);
  }, [supabase]);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    writeJson(SESSION_KEY, null);
    writeJson(LAST_ACTIVITY_KEY, null);
    setUser(null);
  }, [supabase]);

  const requestPasswordReset = useCallback(
    async (email: string) => {
      if (!supabase) {
        throw new Error(
          "La recuperación de contraseña requiere Supabase (no disponible en modo demo).",
        );
      }
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/restablecer`,
      });
      // No se informa si el correo existe; solo fallas del servicio.
      if (error && error.status !== 400 && error.status !== 404) throw new Error(error.message);
    },
    [supabase],
  );

  const updatePassword = useCallback(
    async (password: string) => {
      if (!supabase) {
        throw new Error("El cambio de contraseña requiere Supabase (no disponible en modo demo).");
      }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(error.message);
    },
    [supabase],
  );

  const chooseRole = useCallback(
    async (role: "cliente" | "proveedor") => {
      if (!supabase) throw new Error("No disponible en modo demo.");
      const { error } = await supabase.rpc("choose_role", { p_role: role });
      if (error) throw new Error(error.message);
      const { data } = await supabase.auth.getUser();
      if (data.user) setUser(await loadProfile(supabase, data.user));
    },
    [supabase],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user?.role ?? null,
      loading,
      googleEnabled: Boolean(supabase) && env.googleAuthEnabled,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      requestPasswordReset,
      updatePassword,
      chooseRole,
    }),
    [
      user,
      loading,
      supabase,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      requestPasswordReset,
      updatePassword,
      chooseRole,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
