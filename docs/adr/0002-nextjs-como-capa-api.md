# ADR-0002: Next.js como capa API

- **Estado:** Aceptada
- **Fecha:** 2026-09
- **Decisores:** Equipo Grupo 1 (IIC3113)

## Contexto

El frontend es una SPA (ver [ADR-0003](0003-vite-spa-en-frontend.md)) que necesita una API HTTP
para: buscar proveedores cercanos, obtener detalle y reseñas, crear solicitudes (leads) y
gestionar autenticación contra Supabase. Se requiere una capa que:

- Valide los inputs de forma centralizada.
- Oculte la `service_role` key de Supabase (nunca expuesta al navegador).
- Aplique reglas de negocio (p. ej. verificación de proveedores por parte de ASHRAE).
- Sea rápida de montar para un MVP académico.

## Decisión

Usar **Next.js 16** como capa API mediante **Route Handlers** (`backend/src/app/api/**/route.ts`),
consumiendo `@hvac/shared` para validación con zod y Supabase para persistencia.

La API sigue una **arquitectura en capas**:

```
route handler  →  capa de servicios  →  repositorio/acceso a datos  →  Supabase
   (HTTP)          (reglas de negocio)     (queries PostgREST)          (Postgres/RLS)
```

- **Route handlers**: parseo de request, validación zod, CORS, formato de respuesta
  `ApiResponse<T>` (`{ ok: true, data }` | `{ ok: false, error }`).
- **Servicios**: lógica de negocio (búsqueda geoespacial, transiciones de estado de leads, cálculo
  de ratings).
- **Acceso a datos**: consultas a Supabase aisladas de la lógica de negocio.

Endpoints previstos por el MVP:

| Método | Ruta                         | Descripción                                                             |
| ------ | ---------------------------- | ----------------------------------------------------------------------- |
| `GET`  | `/api/health`                | Estado del servicio.                                                    |
| `GET`  | `/api/providers/search`      | Búsqueda de proveedores cercanos.                                       |
| `GET`  | `/api/providers/:id`         | Detalle de proveedor.                                                   |
| `GET`  | `/api/providers/:id/reviews` | Reseñas de un proveedor.                                                |
| `POST` | `/api/leads`                 | Crear solicitud de servicio.                                            |
| `POST` | `/api/reviews`               | Crear reseña.                                                           |
| `POST` | `/api/chat`                  | Asistente IA (diferido, ver [ADR-0006](0006-diferir-modulo-ia-rag.md)). |

## Alternativas consideradas

| Alternativa                            | Por qué no (en el MVP)                                                                               |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **NestJS**                             | Excelente estructura en módulos, DI y testing, pero mayor ceremonia y curva para el plazo del curso. |
| **Express/Fastify puro**               | Menos opinado; requiere montar validación, CORS y estructura a mano.                                 |
| **Supabase directo desde el frontend** | Expondría lógica y claves; difícil aplicar reglas de negocio y agregaciones.                         |
| **Serverless functions sueltas**       | Fragmentación y sin convención de capas clara.                                                       |

### Ruta de migración futura a NestJS

La decisión de Next.js es **reversible**: al mantener una arquitectura en capas y contratos
definidos en `@hvac/shared`, una migración a NestJS sería incremental.

1. **Aislar la capa de servicios**: los servicios no deben depender de tipos de Next.js ni de
   `Request`/`Response`; reciben y devuelven objetos de dominio.
2. **Extraer repositorios**: encapsular las consultas a Supabase detrás de interfaces.
3. **Mover controladores**: cada route handler pasa a un `@Controller` de NestJS, reutilizando los
   mismos servicios y repositorios.
4. **Reutilizar validación**: los esquemas zod de `@hvac/shared` se conectan con `ZodValidationPipe`
   o con `class-validator` en DTOs.
5. **Desplegar** el servicio NestJS en un contenedor (Railway/Render/Fly.io) mientras el frontend
   solo cambia `VITE_API_BASE_URL`.

Gatillos para migrar: necesidad de websockets/colas, equipos múltiples, o lógica de negocio que
exceda la capacidad de los route handlers.

## Consecuencias

### Positivas

- Puesta en marcha rápida sobre una plataforma serverless (Vercel).
- TypeScript de punta a punta y validación compartida con el frontend vía zod.
- Compatible con la arquitectura en capas, facilitando una futura migración a NestJS.
- Colocation de lógica API y acceso a variables de entorno del servidor.

### Negativas

- Acoplamiento inicial al modelo de route handlers de Next.js.
- Next.js como capa API puede sentirse sobredimensionado (SSR/ISR no se usan).
- Sin inyección de dependencias nativa; el desacoplamiento depende de la disciplina del equipo.
- La migración futura a NestJS, aunque planificada, igualmente implica trabajo de reescritura de
  controladores y de la infraestructura de despliegue.
