import type { Locator, Page, Response } from "@playwright/test";

/**
 * Utilidades compartidas por la suite end-to-end.
 *
 * El modo demo del frontend (sin Supabase configurado) persiste la sesion en
 * `localStorage`. Las claves y la forma del usuario replican exactamente lo que
 * hace `frontend/src/features/auth/auth-context.tsx`:
 *   - clave de sesion:      "hvac-auth-session"
 *   - clave de cuentas:     "hvac-auth-accounts"
 *   - usuario serializado:  { id, email, fullName, role }
 */

export type DemoRole = "cliente" | "proveedor" | "admin";

export const SESSION_STORAGE_KEY = "hvac-auth-session";
export const ACCOUNTS_STORAGE_KEY = "hvac-auth-accounts";
export const DEMO_PASSWORD = "demo1234";

export interface DemoAccount {
  id: string;
  email: string;
  fullName: string;
  role: DemoRole;
}

/** Cuentas sembradas en auth-context.tsx (DEMO_SEED). */
export const DEMO_ACCOUNTS: Record<DemoRole, DemoAccount> = {
  cliente: {
    id: "demo-cliente",
    email: "cliente@demo.cl",
    fullName: "Cliente Demo",
    role: "cliente",
  },
  proveedor: {
    id: "demo-proveedor",
    email: "proveedor@demo.cl",
    fullName: "Proveedor Demo",
    role: "proveedor",
  },
  admin: {
    id: "demo-admin",
    email: "admin@demo.cl",
    fullName: "Admin ASHRAE",
    role: "admin",
  },
};

/** Panel al que redirige el login segun el rol (auth-form.tsx). */
export const PANEL_BY_ROLE: Record<DemoRole, string> = {
  cliente: "/panel/solicitudes",
  proveedor: "/panel/proveedor",
  admin: "/panel/admin/verificaciones",
};

/** Escribe la sesion demo en localStorage antes de que cargue la app. */
export async function seedDemoSession(page: Page, role: DemoRole): Promise<void> {
  const account = DEMO_ACCOUNTS[role];
  const session = JSON.stringify({
    id: account.id,
    email: account.email,
    fullName: account.fullName,
    role: account.role,
  });

  await page.addInitScript(
    ({ key, value }: { key: string; value: string }) => {
      window.localStorage.setItem(key, value);
    },
    { key: SESSION_STORAGE_KEY, value: session },
  );
}

/**
 * Inicia sesion como una cuenta demo. Por defecto siembra el estado de auth en
 * localStorage (rapido y determinista); usa `loginWithCredentials` cuando la
 * prueba necesite ejercitar el formulario real.
 */
export async function loginAsDemo(page: Page, role: DemoRole): Promise<void> {
  await seedDemoSession(page, role);
}

/** Ejercita el formulario real de /ingresar con las credenciales indicadas. */
export async function loginWithCredentials(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/ingresar");
  await page.getByLabel("Correo electronico").fill(email);
  await page.getByLabel("Contrasena").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
}

/**
 * Espera una respuesta de API. `matcher` recibe la URL parseada para poder
 * filtrar por pathname y/o query params.
 */
export function waitForApi(
  page: Page,
  matcher: (url: URL) => boolean,
  method: "GET" | "POST" | "PATCH" | "DELETE" = "GET",
): Promise<Response> {
  return page.waitForResponse((response) => {
    if (response.request().method() !== method) return false;
    try {
      return matcher(new URL(response.url()));
    } catch {
      return false;
    }
  });
}

/** Fija el valor de un `<input type="range">` y dispara los eventos de React. */
export async function setRangeValue(locator: Locator, value: number): Promise<void> {
  await locator.evaluate((element, next) => {
    const input = element as HTMLInputElement;
    // React rastrea el valor del input; usar el setter nativo evita que el
    // evento sintetico sea descartado por no detectar cambios.
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
    if (setter) setter.call(input, String(next));
    else input.value = String(next);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

/**
 * En movil el listado vive tras el toggle Mapa/Lista; en desktop es visible
 * directamente en el aside. Este helper abre el listado cuando hace falta.
 */
export async function ensureProviderListVisible(page: Page, isMobile: boolean): Promise<void> {
  if (!isMobile) return;
  await page.getByRole("button", { name: "Lista" }).first().click();
}

/** Crea un contexto de almacenamiento limpio antes de cada prueba. */
export async function clearStorage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      window.localStorage.clear();
    } catch {
      // Ignorar: solo aplica en contextos con storage disponible.
    }
  });
}
