# Marketplace HVAC — Frontend

Aplicación web del marketplace HVAC: permite a clientes buscar y contratar proveedores HVAC
verificados en Chile mediante mapa, reseñas y filtros, y a proveedores/administradores gestionar
solicitudes y verificaciones desde el panel.

Stack: **React 19 + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui (Radix)**.

## Requisitos

- Node.js 20+
- pnpm 9+ (el repositorio es un workspace de pnpm/Turborepo)

## Scripts

Ejecuta los comandos desde `HVAC-Marketplace/frontend` (o con filtro `pnpm --filter @hvac/frontend`):

| Script           | Descripción                                           |
| ---------------- | ----------------------------------------------------- |
| `pnpm dev`       | Servidor de desarrollo Vite en http://localhost:5173  |
| `pnpm build`     | `tsc --noEmit` + build de producción en `dist/`       |
| `pnpm preview`   | Sirve el build de producción en http://localhost:4173 |
| `pnpm typecheck` | Chequeo de tipos (`tsc --noEmit`)                     |
| `pnpm lint`      | Verificación de formato con Prettier                  |

## Variables de entorno

Crea un archivo `.env.local` (o `.env`) en `frontend/`. Todas las variables expuestas al cliente
deben usar el prefijo `VITE_`:

| Variable                 | Obligatoria | Descripción                                                       |
| ------------------------ | ----------- | ----------------------------------------------------------------- |
| `VITE_API_BASE_URL`      | No          | Base URL del backend. Por defecto `http://localhost:3001`.        |
| `VITE_SUPABASE_URL`      | No          | URL del proyecto Supabase (auth/datos).                           |
| `VITE_SUPABASE_ANON_KEY` | No          | Anon key pública de Supabase.                                     |
| `VITE_MAPTILER_KEY`      | No          | Key de MapTiler para el estilo del mapa; sin ella se usa un demo. |

Las variables se leen de forma centralizada en `src/lib/env.ts`. Si Supabase no está configurado,
`hasSupabaseConfig` es `false` y la app opera en modo demo.

## Estructura de carpetas

```
frontend/
├─ public/                 # robots.txt, manifest.webmanifest, favicon.svg
├─ src/
│  ├─ components/
│  │  ├─ layout/           # Layout público (header, footer)
│  │  └─ ui/               # Primitivos shadcn/ui (button, card, dialog, ...)
│  ├─ data/                # Datos demo de proveedores y reseñas
│  ├─ features/            # Hooks y lógica por dominio (providers)
│  ├─ hooks/               # Hooks reutilizables (useDebounce, useMediaQuery)
│  ├─ lib/                 # api, env, geo, query, seo, supabase, theme, utils
│  ├─ pages/               # Páginas de la app (Home, Search, Provider, panel/...)
│  ├─ App.tsx              # Definición de rutas
│  ├─ main.tsx             # Bootstrap (React Query, router, tema)
│  └─ index.css            # Design tokens y tema Tailwind v4
├─ components.json         # Configuración de shadcn/ui
├─ tsconfig.json
└─ vite.config.ts
```

## Consumir `@hvac/shared`

El paquete `@hvac/shared` (workspace) concentra tipos, esquemas Zod y utilidades comunes. Se
importa directamente desde el código fuente TypeScript, por lo que no requiere build previo:

```ts
import type { ProviderSummary, ProviderDetail, ApiResponse } from "@hvac/shared";
import { leadCreateSchema } from "@hvac/shared/schemas";
import { formatCLP } from "@hvac/shared/utils";
```

Subpaths disponibles: `@hvac/shared`, `@hvac/shared/types`, `@hvac/shared/schemas`,
`@hvac/shared/utils`.

## Consumir la API

El cliente HTTP tipado vive en `src/lib/api.ts` y desempaqueta el envelope
`{ ok: true, data } | { ok: false, error }`:

```ts
import { apiFetch } from "@/lib/api";

const providers = await apiFetch<ProviderSummary[]>(
  "/api/providers/search?lat=-33.45&lng=-70.66&radiusKm=10&limit=20",
);
```

Para datos de servidor usa React Query a través de los hooks de `src/features/*` (por ejemplo
`useNearbyProviders`, `useProvider`, `useCreateLead`), que además aplican fallback a datos demo
cuando el backend no responde. El `QueryClient` se configura en `src/lib/query.ts`.

## UI y accesibilidad

- Los primitivos de `src/components/ui` siguen el patrón shadcn (Radix + `cn`).
- Los componentes exponen roles y atributos ARIA correctos y foco visible.
- Los textos de interfaz están en español.
