# Supabase - Marketplace HVAC

Base de datos local de Supabase para el Marketplace HVAC (PostgreSQL 15 + PostGIS + pgvector).

## Requisitos

- [Supabase CLI](https://supabase.com/docs/guides/cli) (`npx supabase` o instalado global)
- Docker en ejecucion

## Levantar el stack local

```bash
# desde la raiz del repo
npx supabase start
```

Al finalizar, la CLI imprime las URLs y llaves locales (API en `http://localhost:54321`,
DB en `localhost:54322`, Studio en `http://localhost:54323`, Inbucket en `http://localhost:54324`).
Copia la `anon key` y la `API URL` a `frontend/.env` (ver `.env.example`).

## Aplicar migraciones

```bash
# aplica migraciones pendientes + seed
npx supabase db reset
```

`db reset` recrea la base desde cero y ejecuta `supabase/seed.sql` (configurado en
`[db.seed]` de `config.toml`).

Para empujar cambios a un proyecto remoto (despues de linkear con `npx supabase link`):

```bash
npx supabase db push
```

## Regenerar tipos TypeScript

Con el stack local corriendo:

```bash
npx supabase gen types typescript --local > ../shared/src/types/database.types.ts
```

Ajusta la ruta de salida segun donde consumas los tipos. Los tipos no se versionan aqui;
se generan bajo demanda.

## Estructura

```
supabase/
  config.toml                     # configuracion del stack local
  migrations/
    0001_extensions_and_enums.sql # postgis, vector y enums
    0002_schema.sql               # tablas + indices
    0003_rls.sql                  # Row Level Security y politicas
    0004_functions.sql            # RPC, triggers y funciones
  seed.sql                        # catalogo HVAC + proveedores demo
```

## Notas

- `auth.users` es gestionado por Supabase Auth. `public.profiles` se crea
  automaticamente via el trigger `on_auth_user_created`.
- `locations.geom` es `geography(Point,4326)`; las busquedas usan `nearby_providers()`.
- `document_chunks` (RAG de manuales) no tiene policy de lectura; se accede solo
  mediante `match_documents()` (`security definer`). Modulo IA diferido.
