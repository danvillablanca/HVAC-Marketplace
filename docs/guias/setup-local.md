# Guía de setup local

Esta guía permite levantar **Marketplace HVAC** completo en tu máquina: frontend, backend, base
de datos local (Supabase sobre Docker) y datos de demostración.

> Tiempo estimado: 15-25 minutos, la primera vez (descarga de imágenes Docker incluida).

## 1. Requisitos

| Herramienta | Versión mínima    | Verificación    | Notas                                                         |
| ----------- | ----------------- | --------------- | ------------------------------------------------------------- |
| Node.js     | 20 LTS o superior | `node -v`       | El repo declara `engines.node >= 20`.                         |
| pnpm        | 12.x              | `pnpm -v`       | El repo fija `packageManager: pnpm@12.4.2`.                   |
| Docker      | 24+               | `docker -v`     | Requerido por Supabase local. Docker Desktop o Docker Engine. |
| npx         | incluido con Node | `npx --version` | Se usa para los comandos `supabase`.                          |
| Git         | 2.30+             | `git --version` | Para clonar el repositorio.                                   |

Opcionales:

- **MapTiler API key** (`VITE_MAPTILER_KEY`): mejora los estilos del mapa. Si no la configuras,
  MapLibre usa el estilo público de demostración `demotiles.maplibre.org`.
- **Google Gemini API key** (`GEMINI_API_KEY`): el módulo IA/RAG está **diferido** (ver
  [ADR-0006](../adr/0006-diferir-modulo-ia-rag.md)); sin key el backend usa un stub.

### Instalar pnpm

```bash
corepack enable
corepack prepare pnpm@12.4.2 --activate
# Alternativa: npm install -g pnpm@12
```

## 2. Clonar el repositorio

```bash
git clone <URL-del-repositorio> HVAC-Marketplace
cd HVAC-Marketplace
```

## 3. Instalar dependencias

El monorepo usa workspaces de pnpm; un solo comando instala `frontend/`, `backend/` y `shared/`.

```bash
pnpm install
```

Si el lockfile está desactualizado durante desarrollo:

```bash
pnpm install --no-frozen-lockfile
```

## 4. Levantar Supabase local

Supabase corre en contenedores Docker y expone la base de datos, la API y el Studio.

```bash
# Descarga imágenes e inicia los servicios
npx supabase start
```

Al terminar, el CLI imprime un bloque como:

```
API URL: http://127.0.0.1:54321
GraphQL URL: http://127.0.0.1:54321/graphql/v1
DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio URL: http://127.0.0.1:54323
Inbucket URL: http://127.0.0.1:54324
anon key: eyJhbGciOi...
service_role key: eyJhbGciOi...
```

Para volver a verlo en cualquier momento:

```bash
npx supabase status
```

### Puertos por defecto de Supabase

| Servicio               | Puerto  | Uso                                            |
| ---------------------- | ------- | ---------------------------------------------- |
| API / REST (PostgREST) | `54321` | `SUPABASE_URL` y `VITE_SUPABASE_URL`.          |
| PostgreSQL             | `54322` | Conexión directa a la base de datos.           |
| Studio                 | `54323` | Interfaz web para inspeccionar tablas y datos. |
| Inbucket (correo)      | `54324` | Bandeja para mails de confirmación de auth.    |

### Cómo obtener URL y claves

1. Copia `API URL` → `SUPABASE_URL` / `VITE_SUPABASE_URL`.
2. Copia `anon key` → `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY`.
3. Copia `service_role key` → `SUPABASE_SERVICE_ROLE_KEY` (**solo backend**, nunca en el frontend).

> Las claves de Supabase local son públicas y predecibles: no sirven para producción, pero
> tampoco deben versionarse realmente con valores de la nube.

## 5. Configurar variables de entorno

Copia la plantilla y completa los valores locales:

```bash
cp .env.example .env
cp .env.example .env.local
```

| Variable                    | Dónde aplica | Descripción                                          |
| --------------------------- | ------------ | ---------------------------------------------------- |
| `SUPABASE_URL`              | Backend      | URL de la API de Supabase.                           |
| `SUPABASE_ANON_KEY`         | Backend      | Clave pública (RLS aplica).                          |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend      | Clave administrativa; **no exponer en cliente**.     |
| `FRONTEND_ORIGIN`           | Backend      | Origen permitido por CORS (`http://localhost:5173`). |
| `BACKEND_PORT`              | Backend      | Puerto del API Next.js (por defecto `3001`).         |
| `GEMINI_API_KEY`            | Backend      | Opcional. Vacío usa el stub del módulo IA.           |
| `VITE_API_BASE_URL`         | Frontend     | URL del backend (`http://localhost:3001`).           |
| `VITE_SUPABASE_URL`         | Frontend     | URL de Supabase para el cliente de auth.             |
| `VITE_SUPABASE_ANON_KEY`    | Frontend     | Clave anónima de Supabase.                           |
| `VITE_MAPTILER_KEY`         | Frontend     | Opcional. Sin ella se usa el mapa demo.              |

## 6. Aplicar migraciones y datos semilla

```bash
# Recrea la base local aplicando supabase/migrations + supabase/seed
pnpm db:reset
```

Otros comandos de base de datos disponibles en la raíz:

| Comando         | Acción                                                          |
| --------------- | --------------------------------------------------------------- |
| `pnpm db:start` | `npx supabase start`.                                           |
| `pnpm db:stop`  | `npx supabase stop`.                                            |
| `pnpm db:reset` | Borra y reconstruye la base local con migraciones + seed.       |
| `pnpm db:types` | Regenera `shared/src/types/database.ts` desde el esquema local. |

## 7. Correr la aplicación

Desde la raíz del monorepo:

```bash
pnpm dev
```

Turborepo levanta ambos proyectos en paralelo:

| Servicio              | URL                    | Descripción                         |
| --------------------- | ---------------------- | ----------------------------------- |
| Frontend (Vite SPA)   | http://localhost:5173  | Interfaz React 19 + MapLibre.       |
| Backend (Next.js API) | http://localhost:3001  | API REST consumida por el frontend. |
| Supabase Studio       | http://localhost:54323 | Administración de la base de datos. |

También puedes ejecutar cada paquete por separado:

```bash
pnpm --filter @hvac/frontend dev
pnpm --filter @hvac/backend dev
```

### Verificar el backend

```bash
curl http://localhost:3001/api/health
# { "ok": true, "data": { "status": "healthy", ... } }
```

Si `/api/health` responde `ok: true`, el backend está conectado correctamente.

## 8. Datos demo

El proyecto trae dos capas de datos de demostración:

1. **Seed de Supabase** (`supabase/seed`): proveedores, servicios, reseñas y usuarios demo. Se
   cargan con `pnpm db:reset`.
2. **Fallback en el frontend** (`frontend/src/data/providers.ts`): proveedores marcados con
   `isDemo = true` que el frontend usa cuando el backend no responde. Esto permite ver el mapa y
   las fichas sin base de datos.

Las categorías de servicio del catálogo base viven en `shared/src/utils/constants.ts`
(12 servicios en los segmentos residencial, comercial e industrial).

## 9. Problemas comunes

| Síntoma                                               | Causa probable                          | Solución                                                                                 |
| ----------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------- |
| `port is already allocated` al hacer `supabase start` | Otro proceso usa 54321-54324            | Detén el proceso o cambia puertos en `supabase/config.toml`.                             |
| `Cannot connect to the Docker daemon`                 | Docker apagado                          | Inicia Docker Desktop / `sudo systemctl start docker`.                                   |
| `failed to start` / imágenes corruptas                | Docker sin recursos                     | Reinicia Docker, sube memoria, y `npx supabase stop --no-backup` + `npx supabase start`. |
| Frontend no ve datos y muestra demo                   | `VITE_API_BASE_URL` mal o backend caído | Verifica `curl http://localhost:3001/api/health` y el valor de la variable.              |
| Errores de CORS en consola                            | `FRONTEND_ORIGIN` no coincide           | Ajusta `FRONTEND_ORIGIN=http://localhost:5173` en `.env` y reinicia backend.             |
| Mapa en gris / tiles no cargan                        | Sin `VITE_MAPTILER_KEY`                 | Es opcional: el demo público debería cargar. Revisa red/Keys de MapTiler.                |
| No aparece el prompt de geolocalización               | Permisos del navegador                  | Habilita ubicación para `localhost:5173`; en Chrome usa candado → Permisos.              |
| `pnpm install` falla por Node viejo                   | Node < 20                               | Cambia a Node 20+ (`nvm use 20`).                                                        |
| `supabase: command not found`                         | CLI no disponible                       | Usa siempre `npx supabase ...`, o instala el CLI global.                                 |

### Detener el entorno

```bash
pnpm db:stop
# Ctrl+C en la terminal de `pnpm dev`
```
