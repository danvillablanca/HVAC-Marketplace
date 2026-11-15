# Verificación contra Supabase local (`DEMO_MODE=false`)

Recorridos con Playwright que se usaron para cerrar cada bloque contra la base real. A diferencia
de `tests/e2e/` (que corre en modo demo y en CI), estos scripts necesitan Supabase local con el
seed, y algunos consultan la base directamente con `psql` dentro del contenedor.

| Script | Cubre |
| --- | --- |
| `bloque-b.cjs` | Cuentas: registro con términos, login, bloqueo por intentos, recuperación (Mailpit), roles, logout. |
| `bloque-c.cjs` | Perfil del proveedor, verificación, aprobación del admin, búsqueda, contacto oculto (RN-10). |
| `bloque-d.cjs` | Búsqueda: radio por defecto, comuna, filtros, paginación y teselas OSM del mapa. |
| `bloque-e.cjs` | Ciclo completo de una solicitud: cotizar, comparar, aceptar, ejecutar, confirmar, cancelar. |
| `bloque-f.cjs` | Chat y campana en vivo con dos navegadores (latencia < 2 s) y correos. |
| `proveedor-panel.cjs` | Solicitud directa desde el perfil de una empresa, panel y navbar del proveedor. |

## Cómo correrlos

1. Supabase local con datos limpios: `pnpm db:start && pnpm db:reset`.
2. Backend y frontend con Supabase real en puertos libres (por ejemplo 3101 y 5273), con un `.env`
   que tenga las claves de `npx supabase status`, `DEMO_MODE=false`, `VITE_DEMO_MODE=false`,
   `FRONTEND_ORIGIN=http://localhost:5273` y `VITE_API_BASE_URL=http://localhost:3101`.
   Next.js no permite dos `next dev` en la misma carpeta: si ya tienes uno corriendo, usa un
   `git worktree` en una ruta corta (por ejemplo `%TEMP%\hvwt`).
3. Desde la raíz del repo (Git Bash):

```bash
DB=$(docker ps --format '{{.Names}}' | grep supabase_db) REPO="$PWD" node tests/real/bloque-e.cjs
# bloque-f necesita además el log del backend: BACKLOG=/ruta/al/log-del-backend
# Otra URL de frontend: BASE_URL=http://localhost:5173
```

Cada script imprime `[OK]` / `[FAIL]` por paso y un total. Los scripts crean datos nuevos (con un
sello de tiempo); después de usarlos, `pnpm db:reset` deja la base como el seed. **Corre las pruebas
pgTAP (`pnpm db:test`) sobre una base recién reseteada**: algunos conteos dependen del seed.
