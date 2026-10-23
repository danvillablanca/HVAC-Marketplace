# Marketplace HVAC — Backend API

API REST del Marketplace HVAC construida con Next.js 16 (App Router, solo API) y TypeScript.
Todas las respuestas usan el envelope `{ ok: true, data }` o `{ ok: false, error }` de
`@hvac/shared`.

## Requisitos

- Node.js >= 20
- pnpm (workspace del monorepo)

## Scripts

```bash
pnpm dev        # servidor de desarrollo en http://localhost:3001
pnpm build      # build de producción
pnpm start      # servidor de producción en http://localhost:3001
pnpm typecheck  # tsc --noEmit
pnpm lint       # prettier --check .
```

## Variables de entorno

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`: si alguna falta, la API
  responde con datos demo en memoria (`hasSupabase === false`).
- `GEMINI_API_KEY`: opcional; si falta, el asistente IA devuelve un stub (módulo previsto para E2/E3).
- `FRONTEND_ORIGIN`: origen permitido por CORS (default `http://localhost:5173`).

## Endpoints

- `GET /api/health` → estado del servicio y disponibilidad de Supabase.
- `GET /api/providers` → listado general paginado (`segment`, `query`, `limit`, `offset`).
- `GET /api/providers/search` → búsqueda cercana (`lat`, `lng`, `radiusKm`, `segment`, `query`, `limit`, `offset`).
- `GET /api/providers/:id` → detalle de un proveedor (acepta id o slug).
- `GET /api/providers/:id/reviews` → reseñas de un proveedor.
- `POST /api/reviews` → crea una reseña.
- `GET /api/leads` → lista solicitudes (demo).
- `POST /api/leads` → crea una solicitud de servicio.
- `PATCH /api/leads/:id` → actualiza el estado de una solicitud.
- `POST /api/appointments` → agenda una visita.
- `PATCH /api/appointments/:id` → actualiza el estado de una cita.
- `GET /api/admin/verifications` → proveedores pendientes/en revisión.
- `PATCH /api/admin/verifications` → aprueba, rechaza o deja en revisión un proveedor.
- `POST /api/ai/chat` → asistente IA (stub si no hay `GEMINI_API_KEY`).

## Datos demo

Sin Supabase, la API responde con 10 proveedores HVAC seed (mismos ids que el frontend) ubicados
en Santiago, Antofagasta, Concepción, Viña del Mar y Puerto Montt, con servicios en CLP y reseñas.
