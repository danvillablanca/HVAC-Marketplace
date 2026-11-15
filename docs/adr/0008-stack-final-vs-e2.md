# ADR-0008: Stack final vs. documento E2

**Estado:** Aceptada
**Fecha:** 01/11/2026
**Decisión tomada por:** Grupo 1

## Contexto

El Documento de Requerimientos de la Entrega 2 (v1.1) especificaba:

- **Frontend + Backend:** Next.js full-stack (Server Components + API Routes).
- **Mapa:** Leaflet/OpenStreetMap.
- **Monorepo:** No especificado.

Durante el Sprint 1, el equipo evaluó las opciones y optó por un stack diferente que ya está implementado, testeado y funcional (527 tests, CI verde). Este ADR formaliza la divergencia y la justifica.

## Decisión

Mantener el stack actual:

| Componente | E2 (propuesto) | Implementado | Justificación |
|---|---|---|---|
| Frontend | Next.js (SSR/SSG) | Vite SPA (React 19) | Despliegue estático más simple en Vercel; sin dependencia de servidor Node para la UI; HMR <100 ms en desarrollo; mejor separación de responsabilidades. |
| Backend API | Next.js API Routes | Next.js 16 Route Handlers (solo API) | Se mantiene Next.js para la API, pero sin mezclar UI. Permite escalar el backend de forma independiente. |
| Mapa | Leaflet/OpenStreetMap | MapLibre GL JS + OSM/MapTiler | MapLibre es más moderno, soporta WebGL para mejor rendimiento con muchos marcadores, y tiene una API más ergonómica para clustering y estilos. Usa teselas OSM por defecto (sin API key) y MapTiler como opción premium. |
| Monorepo | No especificado | pnpm 12 + Turborepo | Permite compartir tipos zod entre frontend y backend, builds incrementales y CI eficiente. |
| Estilos | No especificado | Tailwind CSS v4 | Utility-first, tree-shaking agresivo, tamaño de bundle mínimo. |

## Consecuencias

- **Solicitud de Cambio** necesaria para la Entrega 3 para documentar la divergencia formalmente.
- El frontend se despliega como sitio estático (Vercel) con un `vercel.json` de rewrite SPA.
- El backend se despliega como aplicación Node.js separada (Vercel Serverless Functions).
- No hay SSR/SSG; el SEO no es un requerimiento del proyecto.
- MapLibre requiere un estilo de teselas; se configura OSM raster como fallback sin API key.

## Alternativas consideradas

1. **Migrar a Next.js full-stack:** Descartada. El frontend ya tiene ~50 tests y componentes maduros. Migrar retrasaría el MVP sin beneficio funcional.
2. **Cambiar a Leaflet:** Descartada. MapLibre ya está integrado con clustering, círculo de radio y marcadores personalizados. Leaflet requeriría plugins adicionales para funcionalidad equivalente.
