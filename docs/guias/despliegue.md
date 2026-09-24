# Guía de despliegue

Estrategia de despliegue del MVP: **frontend y backend como dos proyectos separados en Vercel**,
con **Supabase Cloud** como base de datos y autenticación.

```
┌──────────────────┐     HTTPS/JSON     ┌──────────────────┐
│  Frontend (SPA)  │ ─────────────────▶ │  Backend (API)   │
│  Vercel project  │   CORS: FRONTEND   │  Vercel project  │
│  dist/ (Vite)    │     _ORIGIN        │  Next.js 16      │
└──────────────────┘                    └────────┬─────────┘
        │  auth                                   │ service role
        ▼                                         ▼
┌──────────────────────────────────────────────────────────┐
│                    Supabase Cloud                         │
│        Postgres + Auth + Storage + RLS + PostgREST        │
└──────────────────────────────────────────────────────────┘
```

## 1. Supabase Cloud

### 1.1 Crear el proyecto

1. Ingresa a <https://supabase.com/dashboard> → **New project**.
2. Elige organización, nombre (`hvac-marketplace-prod`), contraseña de base de datos y región
   (por latencia para Chile: `us-east-1` o `sa-east-1`).
3. Espera el aprovisionamiento (~2 min).

### 1.2 Obtener credenciales

En **Project Settings → API**:

| Dato               | Variable                                       | Destino                                |
| ------------------ | ---------------------------------------------- | -------------------------------------- |
| Project URL        | `SUPABASE_URL` / `VITE_SUPABASE_URL`           | Backend y frontend.                    |
| `anon` public key  | `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY` | Backend y frontend.                    |
| `service_role` key | `SUPABASE_SERVICE_ROLE_KEY`                    | **Solo backend**. Nunca en el cliente. |

### 1.3 Aplicar migraciones

Vincula el CLI local al proyecto remoto y sube el esquema:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

- `db push` aplica las migraciones de `supabase/migrations/` al proyecto cloud.
- Para cargar datos de demostración en un entorno de staging: `npx supabase db reset --linked`
  (⚠️ borra datos) o ejecuta el seed manualmente.
- Regenera tipos si el esquema cambió: `pnpm db:types`.

> **Nunca** corras `db push` contra producción sin revisar el diff con `supabase db diff`.

## 2. Desplegar el backend (Vercel)

1. Vercel → **Add New → Project** → importa el repositorio de GitHub.
2. **Root Directory**: `backend/` (importante: cada app es un proyecto distinto).
3. **Framework Preset**: Next.js.
4. **Build Command**: `pnpm build` (o el definido por el preset).
5. **Install Command**: `pnpm install --frozen-lockfile` (Vercel detecta el workspace).
6. Define las **Environment Variables** (Production/Preview):

| Variable                    | Valor                                                                         |
| --------------------------- | ----------------------------------------------------------------------------- |
| `SUPABASE_URL`              | Project URL de Supabase Cloud.                                                |
| `SUPABASE_ANON_KEY`         | anon key.                                                                     |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key (marcar como _Sensitive_).                                   |
| `FRONTEND_ORIGIN`           | URL del frontend en producción, p. ej. `https://hvac-marketplace.vercel.app`. |
| `BACKEND_PORT`              | `3001` (referencial; en Vercel el puerto lo gestiona la plataforma).          |
| `GEMINI_API_KEY`            | Opcional; vacío para usar el stub IA.                                         |

7. Deploy y verifica: `https://<backend>.vercel.app/api/health`.

> Si usas un dominio propio en el frontend, actualiza `FRONTEND_ORIGIN` para que CORS siga
> funcionando. `FRONTEND_ORIGIN` puede aceptar una lista separada por comas si se requiere.

## 3. Desplegar el frontend (Vercel)

1. Vercel → **Add New → Project** → mismo repositorio.
2. **Root Directory**: `frontend/`.
3. **Framework Preset**: Vite.
4. **Build Command**: `pnpm build` → genera `dist/`.
5. **Output Directory**: `dist`.
6. **Environment Variables** (Production/Preview):

| Variable                 | Valor                                                           |
| ------------------------ | --------------------------------------------------------------- |
| `VITE_API_BASE_URL`      | URL pública del backend, p. ej. `https://<backend>.vercel.app`. |
| `VITE_SUPABASE_URL`      | Project URL de Supabase Cloud.                                  |
| `VITE_SUPABASE_ANON_KEY` | anon key.                                                       |
| `VITE_MAPTILER_KEY`      | Opcional; clave de MapTiler.                                    |

7. Deploy y abre la URL del frontend.

> Las variables `VITE_*` se inlinean en el bundle en tiempo de build. Si cambian, hay que
> **redeployar** el frontend.

### SPA y rutas del cliente

Al ser una SPA con React Router, Vercel debe redirigir rutas desconocidas a `index.html`. Si la
configuración automática no lo hace, agrega `frontend/vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## 4. Dominio

| Entorno  | Recomendación                                                 |
| -------- | ------------------------------------------------------------- |
| Frontend | `hvac-marketplace.cl` o subdominio `app.hvac-marketplace.cl`. |
| Backend  | `api.hvac-marketplace.cl`.                                    |

Pasos en Vercel: **Project → Settings → Domains → Add** y sigue las instrucciones DNS (registros
`A`/`CNAME`). Tras el cambio:

1. Actualiza `VITE_API_BASE_URL` con el dominio del backend y **redeploya** el frontend.
2. Actualiza `FRONTEND_ORIGIN` con el dominio del frontend y **redeploya** el backend.
3. Verifica CORS desde el navegador (DevTools → Network, cabecera `Access-Control-Allow-Origin`).

## 5. CI/CD con GitHub Actions

El flujo existente en `.github/workflows/ci.yml` corre en `push` a `main`, `develop`,
`draft/**`, `feature/**` y en `pull_request` hacia `main`/`develop`:

1. `pnpm install --frozen-lockfile`
2. `pnpm typecheck`
3. `pnpm lint`
4. `pnpm build`

Vercel se conecta al repositorio y desplegará:

- **Preview** en cada rama/PR.
- **Production** al mergear a `main` (o a la rama configurada).

> Bloquea merges a `main` hasta que el job **verify** pase (branch protection rules). Para
> promover, sigue el flujo de [contribución](contribucion.md): `feature/* → develop → main`.

## 6. Checklist pre-demo

- [ ] `pnpm typecheck && pnpm lint && pnpm build` en verde localmente.
- [ ] CI verde en la rama a demostrar.
- [ ] `FRONTEND_ORIGIN` apunta al dominio correcto del frontend.
- [ ] `VITE_API_BASE_URL` apunta al backend desplegado.
- [ ] `curl https://<backend>/api/health` responde `ok: true`.
- [ ] Supabase Cloud tiene migraciones aplicadas y datos semilla/staging.
- [ ] Login demo funciona (crear usuario de prueba si es necesario).
- [ ] Mapa carga (con `VITE_MAPTILER_KEY` o el estilo demo).
- [ ] Sin errores rojos en la consola del navegador.
- [ ] Rutas SPA directas (F5 en `/mapa`) funcionan.
- [ ] Datos **no sensibles** en variables de preview.

## 7. Cuotas gratuitas y consideraciones (riesgo R5)

El MVP apunta a mantenerse dentro de los planes gratuitos. Riesgo **R5**: agotar cuotas en demo.

| Servicio       | Plan gratis | Límite típico                                             | Mitigación                                                        |
| -------------- | ----------- | --------------------------------------------------------- | ----------------------------------------------------------------- |
| Vercel         | Hobby       | Ancho de banda/mes, builds, funciones serverless          | Evitar builds innecesarios; cachear; no abusar de funciones.      |
| Supabase       | Free        | 500 MB DB, 1 GB storage, proyecto pausado por inactividad | `db:reset` en local; datos seed livianos; activar antes de demos. |
| MapTiler       | Free        | ~100k tiles/mes                                           | Cachear tiles; fallback a `demotiles.maplibre.org`.               |
| Google Gemini  | Según plan  | Cuota de requests                                         | Módulo IA diferido; usar stub salvo demo específica.              |
| GitHub Actions | Free        | Minutos/mes                                               | CI acotado a typecheck/lint/build.                                |

> El proyecto de Supabase Free **se pausa** tras ~1 semana de inactividad. Reactívalo desde el
> dashboard el día previo a una demo. Si hay riesgo de exceder cuotas durante una presentación,
> usa datos demo del frontend (`frontend/src/data/providers.ts`) como respaldo desconectado.
