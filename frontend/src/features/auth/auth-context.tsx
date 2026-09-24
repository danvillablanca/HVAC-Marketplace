import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { USER_ROLES, type RegisterInput, type UserRole } from "@hvac/shared";
import { getSupabase } from "@/lib/supabase";

/** Usuario autenticado expuesto por el contexto. */
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface AuthContextValue {
  user: AuthUser | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
}

const SESSION_KEY = "hvac-auth-session";
const ACCOUNTS_KEY = "hvac-auth-accounts";

interface DemoAccount extends AuthUser {
  password: string;
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

function readAccounts(): DemoAccount[] {
  if (typeof window === "undefined") return DEMO_SEED;
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    const stored = raw ? (JSON.parse(raw) as DemoAccount[]) : [];
    const merged = new Map<string, DemoAccount>();
    for (const account of DEMO_SEED) merged.set(account.email, account);
    if (Array.isArray(stored)) {
      for (const account of stored) {
        if (account && typeof account.email === "string") merged.set(account.email, account);
      }
    }
    return [...merged.values()];
  } catch {
    return DEMO_SEED;
  }
}

function writeAccounts(accounts: DemoAccount[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function readSession(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    if (!parsed.id || !parsed.email || !isRole(parsed.role)) return null;
    return {
      id: parsed.id,
      email: parsed.email,
      fullName: parsed.fullName ?? parsed.email,
      role: parsed.role,
    };
  } catch {
    return null;
  }
}

function writeSession(user: AuthUser | null): void {
  if (typeof window === "undefined") return;
  if (!user) {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function mapSupabaseUser(user: User): AuthUser {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fullName =
    typeof meta.fullName === "string" && meta.fullName.trim().length > 0
      ? meta.fullName
      : (user.email ?? "Usuario");
  return {
    id: user.id,
    email: user.email ?? "",
    fullName,
    role: isRole(meta.role) ? meta.role : "cliente",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabase();
  const [user, setUser] = useState<AuthUser | null>(() => (supabase ? null : readSession()));
  const [loading, setLoading] = useState<boolean>(() => Boolean(supabase));

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setUser(data.session?.user ? mapSupabaseUser(data.session.user) : null);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? mapSupabaseUser(session.user) : null);
    });
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [supabase]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) {
        const normalized = email.trim().toLowerCase();
        const account = readAccounts().find(
          (candidate) => candidate.email === normalized && candidate.password === password,
        );
        if (!account) {
          throw new Error(
            "Correo o contrasena incorrectos. En modo demo usa cliente@demo.cl / demo1234.",
          );
        }
        const next: AuthUser = {
          id: account.id,
          email: account.email,
          fullName: account.fullName,
          role: account.role,
        };
        writeSession(next);
        setUser(next);
        return;
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      setUser(data.user ? mapSupabaseUser(data.user) : null);
    },
    [supabase],
  );

  const signUp = useCallback(
    async (input: RegisterInput) => {
      if (!supabase) {
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
        };
        writeAccounts([...accounts, account]);
        const next: AuthUser = {
          id: account.id,
          email: account.email,
          fullName: account.fullName,
          role: account.role,
        };
        writeSession(next);
        setUser(next);
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            fullName: input.fullName,
            role: input.role,
            rut: input.rut ?? null,
            phone: input.phone ?? null,
          },
        },
      });
      if (error) throw new Error(error.message);
      if (data.session?.user) setUser(mapSupabaseUser(data.session.user));
      else if (data.user) setUser(mapSupabaseUser(data.user));
    },
    [supabase],
  );

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    writeSession(null);
    setUser(null);
  }, [supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, role: user?.role ?? null, loading, signIn, signUp, signOut }),
    [user, loading, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
