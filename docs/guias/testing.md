# Guía de pruebas

Estrategia de verificación del monorepo **Marketplace HVAC**. Complementa la
[estrategia de pruebas del documento de diseño](../diseno/documento-de-diseno.md#12-estrategia-de-pruebas)
y describe cómo se organizan, escriben y ejecutan las pruebas en cada paquete.

> Regla base: **ningún PR se integra sin pruebas y con `pnpm typecheck && pnpm test` en verde**.
> Ver [contribución](contribucion.md#pruebas).

## 1. Pirámide de pruebas

```
          ▲  E2E (Playwright)
         ╱ ╲  pocos, flujos críticos de usuario, navegador real
        ╱───╲
       ╱ Int ╲  contratos API ↔ servicios ↔ datos demo
      ╱───────╲
     ╱  Unit   ╲  muchos, rápidos y deterministas (utils, schemas, hooks, UI)
    ╱───────────╲
```

| Nivel           | Herramienta | Ámbito                                                                                                                      | Costo | Ejemplos                                                                      |
| --------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------- | ----- | ----------------------------------------------------------------------------- |
| **Unitario**    | Vitest      | Funciones puras, schemas zod, hooks y componentes aislados.                                                                 | Bajo  | `formatCLP`, `isValidRut`, `nearbySearchSchema`, `useDebounce`, `StarRating`. |
| **Integración** | Vitest      | Servicios del backend con fallback demo, `apiFetch`, hooks de datos con `fetch` mockeado, render de features con providers. | Medio | `searchNearby`, `createReview`, `useNearbyProviders`, `LeadForm`.             |
| **E2E**         | Playwright  | Flujos completos en Chromium y móvil, con backend y frontend reales.                                                        | Alto  | Búsqueda → ficha → solicitud → reseña.                                        |

Criterio de reparto: si el caso se puede aislar con una función o un render, va a **unitario**;
si valida un contrato entre capas, a **integración**; si solo se puede comprobar recorriendo la
app, a **E2E**.

## 2. Cobertura por paquete

Cada workspace declara su propio `test` (Vitest) con configuración independiente.

| Paquete          | Config                      | Entorno | Incluye                         | Se enfoca en                                                                                                                             |
| ---------------- | --------------------------- | ------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `@hvac/shared`   | `shared/vitest.config.ts`   | `node`  | `src/**/*.{test,spec}.ts`       | **utils** (`rut`, `format`, `constants`) y **schemas** zod.                                                                              |
| `@hvac/backend`  | `backend/vitest.config.ts`  | `node`  | `src/**/*.{test,spec}.ts`       | **services** (`providers`, `leads`, `reviews`, `appointments`, `verification`, `ai`), `mappers` y **route handlers** (`src/app/api/**`). |
| `@hvac/frontend` | `frontend/vitest.config.ts` | `jsdom` | `src/**/*.{test,spec}.{ts,tsx}` | **UI** (`components/ui`), **hooks** (`src/hooks`), **features** y **pages**.                                                             |

Cobertura instrumentada (`coverage.provider: v8`):

| Paquete          | Rutas incluidas en coverage                              |
| ---------------- | -------------------------------------------------------- |
| `@hvac/shared`   | Todo `src/` (utils + schemas).                           |
| `@hvac/backend`  | `src/services/**`, `src/lib/**`, `src/data/**`.          |
| `@hvac/frontend` | `src/lib/**`, `src/features/**`, `src/components/ui/**`. |

### 2.1 `shared/` — utils y schemas

- **utils**: `normalizeRut`, `computeRutDv`, `isValidRut`, `formatRut`, `formatCLP`,
  `normalizePhone`, `formatPhone`, `formatDistance`, `formatDate`, `SERVICE_CATEGORIES`,
  `CHILE_REGIONS`, `DEFAULT_MAP_CENTER`.
- **schemas** (`auth`, `provider`, `review`, `lead`, `appointment`, `search`): casos válidos e
  inválidos de cada `zod` schema (`safeParse`), incluidos bordes (RUT con/sin puntos, rating
  fuera de rango, radios y límites de paginación).

### 2.2 `backend/` — services y route handlers

- **services**: con Supabase desactivado (`getServiceClient()` devuelve `null`) cada servicio cae
  al **fallback demo** (`src/data/demo.ts`). Es el camino más fácil de probar sin base de datos:
  `searchNearby`, `listProviders`, `getProvider`, `listReviews`, `createReview`, `createLead`,
  `createAppointment`, `decideVerification`.
- **mappers** (`src/services/mappers.ts`): transformación fila BD → tipo de dominio.
- **route handlers** (`src/app/api/**/route.ts`): invocando el handler con un `Request` se valida
  el envelope `ApiResponse<T>` (`{ ok, data }` / `{ ok, error }`), códigos HTTP (200/422/502) y
  `parseBody` / `parseQuery` de `src/lib/http.ts`.

### 2.3 `frontend/` — UI, hooks, features y pages

- **UI** (`components/ui`): render y accesibilidad de primitivas (botones, dialog, tabs).
- **hooks**: `useDebounce`, `useMediaQuery`, `useGeolocation` (con `navigator.geolocation`
  mockeado), y los hooks de datos de `features/providers/hooks.ts` (con `fetch` mockeado).
- **features**: `StarRating`, `ProviderCard`, `LeadForm`, `ReviewForm`, `VerificationBadge`,
  `verification-wizard`, `admin-verification-table`.
- **pages**: render de vistas con router (`renderWithProviders`) y estados de carga/error/vacío.

### 2.4 E2E — flujos

`playwright.config.ts` define `testDir: ./tests/e2e` y dos projects:

| Project    | Dispositivo    | Uso                                     |
| ---------- | -------------- | --------------------------------------- |
| `chromium` | Desktop Chrome | Flujo principal de escritorio.          |
| `mobile`   | Pixel 7        | Comportamiento responsive y menú móvil. |

Playwright levanta automáticamente el backend en `:3101` y el frontend en `:5173` (`webServer`),
por lo que los E2E se ejecutan contra la app real con datos demo.

Flujos críticos sugeridos:

1. **Buscar y filtrar** proveedores por segmento/radio en el mapa y en la lista.
2. **Ver ficha** de proveedor, servicios, reseñas y badge de verificación.
3. **Enviar solicitud** (lead) desde la ficha y confirmar el mensaje de éxito.
4. **Publicar reseña** con rating y verla reflejada en la ficha.
5. **Autenticación demo**: login `cliente@demo.cl / demo1234` y acceso al panel.

## 3. Convenciones

| Regla                    | Detalle                                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| **Imports explícitos**   | Importa `describe`, `it`, `expect`, `vi`, `beforeEach` desde `"vitest"`. **No** se habilitan globals.      |
| **Ubicación**            | El test vive junto al código: `src/lib/geo.test.ts`, `src/features/providers/hooks.test.tsx`.              |
| **Nombre**               | `*.test.ts` / `*.test.tsx` (Vitest); `*.spec.ts` en `tests/e2e/` (Playwright).                             |
| **Render con providers** | Usa `renderWithProviders(ui, { route, queryClient })` desde `@/test/render`.                               |
| **User events**          | Prefiere `userEvent` (reexportado por `@/test/render`) sobre `fireEvent`.                                  |
| **Queries accesibles**   | Consulta por rol/texto (`getByRole`, `getByLabelText`), no por clases CSS.                                 |
| **Mocks**                | `vi.fn()` + `vi.stubGlobal`; restaura con `vi.restoreAllMocks()` / `vi.unstubAllGlobals()` en `afterEach`. |
| **Determinismo**         | Evita fechas y aleatoriedad sin mockear; usa los datos demo conocidos.                                     |
| **Idioma**               | Nombres de tests en español, descriptivos del comportamiento (`describe("isValidRut")`).                   |

### 3.1 `renderWithProviders`

`frontend/src/test/render.tsx` envuelve el componente con los providers reales de la app:
`QueryClientProvider` (con `retry: false`, `gcTime: 0`), `ThemeProvider`, `TooltipProvider`,
`MemoryRouter` y `AuthProvider`. También reexporta `@testing-library/react` y `userEvent`.

```tsx
import { describe, expect, it } from "vitest";
import { renderWithProviders, screen, userEvent } from "@/test/render";
import { LeadForm } from "./lead-form";

describe("LeadForm", () => {
  it("valida el teléfono antes de enviar", async () => {
    renderWithProviders(<LeadForm providerId="p-clima-andes" />, { route: "/proveedores" });
    await userEvent.type(screen.getByLabelText(/teléfono/i), "123");
    await userEvent.click(screen.getByRole("button", { name: /enviar/i }));
    expect(await screen.findByText(/teléfono inválido/i)).toBeInTheDocument();
  });
});
```

### 3.2 Mocks frecuentes

**`fetch`** — para `apiFetch` y los hooks de datos:

```ts
import { afterEach, vi } from "vitest";

afterEach(() => {
  vi.restoreAllMocks();
});

vi.stubGlobal(
  "fetch",
  vi.fn(
    async () =>
      new Response(JSON.stringify({ ok: true, data: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
  ),
);
```

**MapLibre** — jsdom no tiene WebGL; mockea el módulo al probar `MapView`:

```ts
vi.mock("maplibre-gl", () => ({
  Map: class {
    on() {}
    addControl() {}
    addSource() {}
    addLayer() {}
    remove() {}
    getSource() {
      return undefined;
    }
  },
  Marker: class {
    setLngLat() {
      return this;
    }
    addTo() {
      return this;
    }
    getElement() {
      return document.createElement("div");
    }
    remove() {}
  },
  NavigationControl: class {},
  ScaleControl: class {},
}));
```

**Geolocalización** — para `useGeolocation`:

```ts
vi.stubGlobal("navigator", {
  ...navigator,
  geolocation: {
    getCurrentPosition: vi.fn((success) =>
      success({ coords: { latitude: -33.4489, longitude: -70.6693 } }),
    ),
  },
});
```

> `frontend/src/test/setup.ts` ya provee polyfills de `matchMedia`, `ResizeObserver`,
> `IntersectionObserver` y `window.scrollTo`, y ejecuta `cleanup()` tras cada test.

## 4. Comandos

### 4.1 Ejecutar todo

```bash
pnpm test          # unit + integración en los 3 paquetes (turbo run test)
pnpm test:e2e      # Playwright (levanta backend :3101 y frontend :5173)
pnpm test:e2e:ui   # Playwright en modo UI
```

`pnpm test` (Turborepo) compila primero las dependencias (`dependsOn: ["^build"]`) y luego corre
el `test` de cada paquete.

### 4.2 Un paquete

```bash
pnpm --filter @hvac/shared test
pnpm --filter @hvac/backend test
pnpm --filter @hvac/frontend test
```

### 4.3 Un archivo o patrón

```bash
# Un archivo puntual
pnpm --filter @hvac/frontend exec vitest run src/lib/api.test.ts

# Por nombre de test (regex)
pnpm --filter @hvac/frontend exec vitest run -t "isValidRut"

# Un archivo E2E
pnpm exec playwright test tests/e2e/busqueda.spec.ts

# Solo un project de Playwright
pnpm exec playwright test --project=chromium
```

### 4.4 Modo watch

```bash
pnpm --filter @hvac/frontend test:watch
pnpm --filter @hvac/backend test:watch
pnpm --filter @hvac/shared test:watch
```

### 4.5 Cobertura

```bash
pnpm --filter @hvac/frontend exec vitest run --coverage
pnpm --filter @hvac/backend exec vitest run --coverage
pnpm --filter @hvac/shared exec vitest run --coverage
```

Genera reporte `text` en consola y `html` en `coverage/` (según `vitest.config.ts`). El provider
`v8` requiere el paquete `@vitest/coverage-v8`; si no está instalado, agrégalo con
`pnpm --filter <paquete> add -D @vitest/coverage-v8`.

## 5. Cómo escribir un test nuevo

1. **Ubica el archivo** junto al código a probar (`foo.ts` → `foo.test.ts`).
2. **Importa desde `"vitest"`** y, en frontend, usa `renderWithProviders` desde `@/test/render`.
3. **Arrange-Act-Assert**: prepara datos demo o mocks, ejecuta la acción y afirma el resultado.
4. **Cubre el camino feliz y al menos un borde** (input inválido, error de red, lista vacía).
5. **Evita acoplarte a la implementación**: verifica comportamiento observable (texto, roles,
   `data` retornada), no detalles internos.
6. **Aísla**: si hay estado global (localStorage, queryClient), límpialo en `beforeEach`.
7. **Ejecuta** el archivo en watch mientras desarrollas y luego el paquete completo:

   ```bash
   pnpm --filter @hvac/frontend test
   ```

8. Antes del PR: `pnpm typecheck && pnpm test` (y `pnpm test:e2e` si tocaste flujos).

Ejemplo mínimo de integración backend (sin Supabase → fallback demo):

```ts
import { describe, expect, it } from "vitest";
import { searchNearby } from "./providers";

describe("searchNearby", () => {
  it("ordena por distancia y respeta el radio", async () => {
    const result = await searchNearby({
      lat: -33.4489,
      lng: -70.6693,
      radiusKm: 10,
      limit: 20,
      offset: 0,
    });
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].distanceMeters).toBeLessThanOrEqual(10_000);
  });
});
```

## 6. Datos demo usados en pruebas

El modo demo (sin Supabase) es la base de la mayoría de tests de integración y de los E2E.

| Fuente                                        | Contenido                                                                                               | Uso                                        |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `shared/src/utils/constants.ts`               | 12 `SERVICE_CATEGORIES`, `MODALITIES`, `CHILE_REGIONS`, `DEFAULT_MAP_CENTER`.                           | Catálogo y centro del mapa.                |
| `backend/src/data/demo.ts`                    | 10 proveedores, reseñas, `distanceMeters`, `searchDemoProviders`, `listDemoProviders`, `addDemoReview`. | Fallback de servicios backend.             |
| `frontend/src/data/providers.ts`              | `DEMO_PROVIDERS`, `DEMO_REVIEWS`, `findDemoProvider`.                                                   | Fallback del frontend y tests de hooks/UI. |
| `frontend/src/features/auth/auth-context.tsx` | Cuentas `cliente@demo.cl`, `proveedor@demo.cl`, `admin@demo.cl` (password `demo1234`).                  | Tests de auth y E2E de paneles.            |
| `supabase/seed/`                              | Mismo dataset cargado con `pnpm db:reset`.                                                              | Pruebas contra Supabase local.             |

IDs demo estables y útiles como fixtures: `p-clima-andes` (industrial, verificado),
`p-hogar-fresco` (residencial, verificado), `p-termica-norte` (industrial, `en_revision`),
`p-calor-central` (residencial, `pendiente`).

## 7. Problemas comunes

| Síntoma                                         | Causa                                                                                                      | Solución                                                                                                                       |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `ReferenceError: ResizeObserver is not defined` | jsdom no implementa `ResizeObserver` (lo usan MapLibre y algunos componentes).                             | Ya está polyfilleado en `frontend/src/test/setup.ts`; si usas otro entorno, agrégalo.                                          |
| `window.matchMedia is not a function`           | jsdom no implementa `matchMedia` (tema y media queries).                                                   | Polyfill incluido en `setup.ts`.                                                                                               |
| `IntersectionObserver is not defined`           | jsdom no lo trae (`motion` con `whileInView`).                                                             | Polyfill incluido en `setup.ts`.                                                                                               |
| Falla al renderizar `MapView` / `WebGL context` | jsdom no tiene WebGL.                                                                                      | Mockea `maplibre-gl` (ver §3.2) o prueba la lógica pura (`buildCircle`, `distanceMeters`).                                     |
| El test espera datos reales y recibe demo       | Supabase desactivado: `getServiceClient()`/`getSupabase()` devuelven `null` y se usa el **fallback demo**. | Es el comportamiento esperado. Para probar contra BD, levanta Supabase local y define las variables.                           |
| `fetch` no definido o responde `undefined`      | Node/jsdom no mockean la red.                                                                              | Mockea `fetch` con `vi.stubGlobal` y devuelve `Response` con el envelope `{ ok, data }`.                                       |
| E2E falla por `ECONNREFUSED` en `:3101`/`:5173` | Los `webServer` no arrancaron o el puerto está ocupado.                                                    | Verifica que no haya procesos en esos puertos; Playwright los levanta solo. Usa `E2E_API_PORT`/`E2E_WEB_PORT` para cambiarlos. |
| `reuseExistingServer` deja un server viejo      | Sin `CI`, Playwright reutiliza un server ya corriendo.                                                     | Detén el `pnpm dev` previo o borra el proceso en el puerto.                                                                    |
| Playwright no encuentra navegador               | Faltan binarios.                                                                                           | `pnpm exec playwright install --with-deps chromium` (lo hace el CI).                                                           |
| Test intermitente por `retry` de React Query    | Reintentos reales en errores.                                                                              | `renderWithProviders` ya usa `retry: false`; no crees un `QueryClient` con retries en tests.                                   |

> CI ejecuta `typecheck`, `lint`, `build`, `pnpm test` y `pnpm test:e2e` en ese orden
> (`.github/workflows/ci.yml`). Reproducir esa secuencia en local evita sorpresas.
