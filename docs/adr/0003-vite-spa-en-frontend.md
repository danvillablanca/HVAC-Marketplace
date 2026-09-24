# ADR-0003: Vite + SPA en el frontend

- **Estado:** Aceptada
- **Fecha:** 2026-09
- **Decisores:** Equipo Grupo 1 (IIC3113)

## Contexto

La interfaz es una aplicación interactiva centrada en el usuario final: mapa geoespacial con
proveedores, búsqueda con filtros, fichas de proveedor, paneles de proveedor y administración. No
hay requisitos de SEO fuerte ni de renderizado en servidor para el MVP: el valor está en la
interactividad en el navegador (mapa, geolocalización, filtros).

## Decisión

Construir el frontend como **Single Page Application (SPA)** con **React 19 + Vite 8 + TypeScript +
Tailwind CSS v4**, con las siguientes piezas:

- **Vite** como bundler y servidor de desarrollo (puerto `5173`).
- **React Router 7** para las rutas del cliente.
- **TanStack Query** para data fetching, caché y estado de servidor.
- **Tailwind v4** con tokens del design system "Aire Limpio"
  (ver [ADR-0007](0007-diseno-aire-limpio.md)).
- Componentes accesibles basados en **Radix UI**.

Rutas principales: `/`, `/mapa`, `/buscar`, `/proveedor/:id`, `/chat`, `/para-proveedores`,
`/ingresar`, `/registro` y paneles `/panel/*`.

## Alternativas consideradas

| Alternativa                            | Por qué no                                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Next.js (SSR/SSG)** para el frontend | La app es interactiva y detrás de login en su mayoría; SSR agrega complejidad sin beneficio claro en el MVP. |
| **Create React App**                   | Deprecado y sin mantenimiento activo.                                                                        |
| **Remix**                              | Excelente para flujos con datos en servidor, pero innecesario para una SPA con API separada.                 |
| **Astro**                              | Bueno para contenido estático, menos natural para apps altamente interactivas.                               |

## Consecuencias

### Positivas

- Arranque y recarga en desarrollo muy rápidos (Vite/HMR).
- Build simple y estático (`dist/`) desplegable en cualquier CDN (Vercel, Netlify, etc.).
- Separación clara frontend/backend, alineada con la arquitectura en capas del backend.
- Ecosistema React amplio para mapa y componentes.

### Negativas

- SEO limitado (metadatos renderizados en cliente) — aceptable para el MVP.
- Requiere configuración de _rewrites_ para servir rutas SPA en hosting estático.
- La carga inicial del bundle debe cuidarse (code splitting si crece).
- Estado de autenticación y sesión viven en el cliente, con las precauciones correspondientes.
