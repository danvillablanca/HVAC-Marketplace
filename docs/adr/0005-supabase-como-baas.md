# ADR-0005: Supabase como BaaS

- **Estado:** Aceptada
- **Fecha:** 2026-09
- **Decisores:** Equipo Grupo 1 (IIC3113)

## Contexto

El MVP necesita, en el menor tiempo posible y con bajo costo:

- Base de datos **PostgreSQL** relacional (proveedores, servicios, leads, reseñas, usuarios).
- **Autenticación** con roles (`cliente`, `proveedor`, `admin`).
- Consultas **geoespaciales** (búsqueda por cercanía) y de agregación (ratings).
- Entorno **local reproducible** para desarrollo y CI, y uno en la nube para demo.

## Decisión

Adoptar **Supabase** como Backend-as-a-Service:

- **Postgres** gestionado + extensiones (PostGIS para geolocalización).
- **Auth** integrado (email/contraseña) con roles vía RLS.
- **PostgREST** para acceso desde el backend.
- **Row Level Security (RLS)** por rol para proteger datos.
- **Supabase CLI** para migraciones (`supabase/migrations`), seed (`supabase/seed`) y entorno
  **local con Docker**: `npx supabase start`, `pnpm db:reset`, `pnpm db:types`.

El backend usa la `service_role` key para operaciones administrativas; la `anon` key se expone al
frontend solo para autenticación, protegida por RLS.

## Alternativas consideradas

| Alternativa                                  | Por qué no                                                          |
| -------------------------------------------- | ------------------------------------------------------------------- |
| **Postgres propio (RDS/Neon) + auth a mano** | Más trabajo: migraciones, auth, RLS, storage y panel.               |
| **Firebase**                                 | Modelo NoSQL y geoespacial menos natural; el dominio es relacional. |
| **MongoDB Atlas**                            | Sin relaciones fuertes ni SQL; peor para reportes y agregaciones.   |
| **Prisma + DB gestionada**                   | Válido, pero Supabase ya integra auth y API listas para el MVP.     |

## Consecuencias

### Positivas

- Acelera el desarrollo: auth, base de datos, RLS y panel (Studio) listos.
- Entorno local reproducible con Docker, ideal para onboarding y CI.
- Migraciones versionadas y generación de tipos (`pnpm db:types`) hacia `@hvac/shared`.
- PostGIS habilita búsquedas por cercanía eficientes.
- Capa gratuita adecuada para el alcance académico.

### Negativas

- **Acoplamiento al proveedor** (Supabase); migrar requeriría reimplementar auth y RLS.
- Límites del plan gratuito (500 MB DB, proyecto pausado por inactividad) → riesgo R5.
- Curva de aprendizaje de RLS y del CLI.
- La lógica de acceso a datos queda parcialmente expresada en políticas SQL, menos visible en el
  código TypeScript.
