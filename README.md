# Marketplace HVAC

[![CI](https://github.com/<org>/HVAC-Marketplace/actions/workflows/ci.yml/badge.svg)](https://github.com/<org>/HVAC-Marketplace/actions/workflows/ci.yml)
![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)
![pnpm](https://img.shields.io/badge/pnpm-12-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)
![License](https://img.shields.io/badge/license-Acad%C3%A9mica-lightgrey)

Plataforma para **encontrar y contratar proveedores HVAC verificados en Chile**: búsqueda
geoespacial, fichas con reseñas y respaldo de estándares **ASHRAE**.

- **Cliente:** ASHRAE Chile
- **Proyecto:** IIC3113 — Grupo 1
- **Estado:** MVP en construcción (andamiaje y flujo core).

## Captura conceptual

> _Wireframe conceptual (la interfaz se construye con el design system "Aire Limpio")._

```
┌──────────────────────────────────────────────────────────────────┐
│  ◈ Marketplace HVAC        Mapa  Buscar  Asistente   [Ingresar]  │
├──────────────────────────────────────────────────────────────────┤
│   Encuentra el proveedor HVAC                                🌗  │
│   adecuado, cerca de ti                                          │
│   [ Radio ▾ ]  [ Servicio ▾ ]           ┌──────────────────────┐ │
│   ┌───────────────────────────────┐     │  ● Clima Andes       │ │
│   │        🗺️  mapa               │     │   $ 4.8 ★ (32)       │ │
│   │      (proveedores cercanos)   │     │   Split · 2.3 km     │ │
│   │         📍 📍  📍             │     │  ● Frío Sur Ltda.    │ │
│   │            📍                 │     │    4.6 ★ (18)        │ │
│   └───────────────────────────────┘     └──────────────────────┘ │
├──────────────────────────────────────────────────────────────────┤
│  Proyecto académico IIC3113 · Cliente: ASHRAE Chile              │
└──────────────────────────────────────────────────────────────────┘
```

## Características del MVP

- **Búsqueda geoespacial** de proveedores por cercanía, segmento y texto.
- **Mapa interactivo** (MapLibre GL) con filtros y geolocalización del usuario.
- **Fichas de proveedor** con servicios, modalidades, precios desde y reseñas.
- **Verificación de proveedores** por parte de ASHRAE (estados: pendiente, en revisión,
  verificado, rechazado).
- **Solicitudes de servicio (leads)** con urgencia y medio de contacto preferido.
- **Reseñas** con rating de 1 a 5.
- **Autenticación y roles** (`cliente`, `proveedor`, `admin`) sobre Supabase.
- **Paneles** de proveedor, verificación (admin) y solicitudes del cliente.
- **Asistente IA HVAC** — _diferido_ como stub en esta fase
  ([ADR-0006](docs/adr/0006-diferir-modulo-ia-rag.md)).

## Stack

| Capa          | Tecnología                                                                           |
| ------------- | ------------------------------------------------------------------------------------ |
| Frontend      | React 19, Vite 8, TypeScript, Tailwind CSS v4, MapLibre GL, TanStack Query, Radix UI |
| Backend       | Next.js 16 (Route Handlers), TypeScript, Supabase                                    |
| Compartido    | `@hvac/shared` — zod, tipos y utilidades                                             |
| Base de datos | PostgreSQL (Supabase) + Auth + RLS + PostGIS                                         |
| Monorepo      | pnpm workspaces 12 + Turborepo 2                                                     |
| CI            | GitHub Actions (typecheck, lint, build, `pnpm test`, E2E Playwright)                 |
| Despliegue    | Vercel (frontend y backend) + Supabase Cloud                                         |

## Estructura del monorepo

```
HVAC-Marketplace/
├── frontend/                 # SPA React + Vite + Tailwind + MapLibre
│   └── src/
│       ├── components/       # UI (ui/) y layout
│       ├── features/         # hooks de dominio
│       ├── pages/            # vistas por ruta
│       ├── data/             # datos demo/fallback
│       └── lib/              # api, supabase, env, geo, utils
├── backend/                  # API Next.js 16 + Supabase
│   └── src/app/api/          # route handlers (REST)
├── shared/                   # @hvac/shared: zod + tipos + utils
│   └── src/{schemas,types,utils}/
├── supabase/                 # migraciones y seed
│   ├── migrations/
│   └── seed/
├── docs/
│   ├── diseno/               # diseño y alcance (fuente de verdad)
│   ├── guias/                # setup, despliegue, contribución
│   ├── adr/                  # decisiones de arquitectura
│   └── entregables/          # índice de entregables del curso
├── .github/workflows/ci.yml  # CI
├── .env.example              # plantilla de variables
├── package.json              # scripts raíz + workspace
├── pnpm-workspace.yaml
└── turbo.json
```

## Requisitos

- **Node.js** >= 20
- **pnpm** 12 (`corepack enable && corepack prepare pnpm@12.4.2 --activate`)
- **Docker** (para Supabase local)

## Quick start

```bash
# 1. Clonar e instalar
git clone <URL-del-repositorio> HVAC-Marketplace
cd HVAC-Marketplace
pnpm install

# 2. Base de datos local (Docker)
npx supabase start          # copia URL y claves que imprime el CLI

# 3. Variables de entorno
cp .env.example .env
cp .env.example .env.local  # completa SUPABASE_URL y claves

# 4. Migraciones + datos semilla
pnpm db:reset

# 5. Levantar frontend + backend
pnpm dev
```

| Servicio        | URL                              |
| --------------- | -------------------------------- |
| Frontend        | http://localhost:5173            |
| Backend API     | http://localhost:3001            |
| Health check    | http://localhost:3001/api/health |
| Supabase Studio | http://localhost:54323           |

Guía completa: [docs/guias/setup-local.md](docs/guias/setup-local.md).

## Scripts

| Comando            | Descripción                                                                   |
| ------------------ | ----------------------------------------------------------------------------- |
| `pnpm dev`         | Levanta frontend y backend en paralelo (Turborepo).                           |
| `pnpm build`       | Build de todos los paquetes.                                                  |
| `pnpm typecheck`   | Verificación de tipos (TS strict).                                            |
| `pnpm lint`        | Verificación de formato/estilo.                                               |
| `pnpm test`        | Pruebas unitarias e integración de todos los paquetes (Vitest vía Turborepo). |
| `pnpm test:e2e`    | Pruebas end-to-end con Playwright (Chromium + móvil).                         |
| `pnpm test:e2e:ui` | Playwright en modo UI interactivo.                                            |
| `pnpm format`      | Aplica Prettier a todo el repo.                                               |
| `pnpm db:start`    | Inicia Supabase local (`npx supabase start`).                                 |
| `pnpm db:stop`     | Detiene Supabase local.                                                       |
| `pnpm db:reset`    | Reconstruye la base local con migraciones + seed.                             |
| `pnpm db:types`    | Regenera tipos de base de datos hacia `@hvac/shared`.                         |

## Pruebas

El proyecto usa **Vitest** (unitarias e integración, por paquete) y **Playwright** (E2E). Todo PR
debe incluir pruebas y pasar `pnpm typecheck && pnpm test`.

| Nivel       | Herramienta | Alcance                                                                  |
| ----------- | ----------- | ------------------------------------------------------------------------ |
| Unitario    | Vitest      | Utils y schemas de `@hvac/shared`, hooks y componentes.                  |
| Integración | Vitest      | Servicios/route handlers del backend y features del frontend.            |
| E2E         | Playwright  | Flujos críticos en Chromium y móvil (backend `:3101`, frontend `:5173`). |

```bash
pnpm test                              # unit + integración de todo el monorepo
pnpm --filter @hvac/frontend test      # un solo paquete
pnpm test:e2e                          # end-to-end
```

Guía completa (pirámide, convenciones, mocks y problemas comunes):
[docs/guias/testing.md](docs/guias/testing.md).

## Documentación

- **Diseño y alcance:** [docs/diseno/](docs/diseno/)
- **Guías:** [setup local](docs/guias/setup-local.md) ·
  [despliegue](docs/guias/despliegue.md) · [contribución](docs/guias/contribucion.md) ·
  [pruebas](docs/guias/testing.md)
- **ADRs:** [docs/adr/](docs/adr/) (0001 monorepo, 0002 API, 0003 SPA, 0004 mapa, 0005 Supabase,
  0006 IA diferida, 0007 diseño "Aire Limpio")
- **Entregables del curso:** [docs/entregables/](docs/entregables/README.md)

## Estado del proyecto

| Hito                          | Fecha | Estado      |
| ----------------------------- | ----- | ----------- |
| E1 — Inicio y planificación   | 01/10 | En progreso |
| E2 — Alcance y plan detallado | 01/11 | Pendiente   |
| E3 — Cierre y evaluación      | 24/11 | Pendiente   |

Ramas: `main` (estable), `develop` (integración), `draft/ai-scaffold` (exploración),
`feature/*` (trabajo). Commits convencionales. Ver [contribución](docs/guias/contribucion.md).

## Licencia

Proyecto **académico** desarrollado para el curso IIC3113 (Grupo 1), cliente ASHRAE Chile. Uso
exclusivamente educativo; no constituye un producto comercial.
