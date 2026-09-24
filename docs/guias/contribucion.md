# Guía de contribución

Convenciones de trabajo del equipo para el monorepo **Marketplace HVAC**. Aplican a todo el
repositorio (`frontend/`, `backend/`, `shared/`, `supabase/`, `docs/`).

## 1. Ramas

| Rama                          | Propósito                                                                   | Protegida |
| ----------------------------- | --------------------------------------------------------------------------- | --------- |
| `main`                        | Versión estable, entregable. Solo recibe merges desde `develop`.            | ✅        |
| `develop`                     | Integración continua del equipo. Recibe `feature/*`.                        | ✅        |
| `draft/ai-scaffold`           | Exploración y andamiaje generado/asistido por IA. **No** se mergea directo. | ❌        |
| `feature/<descripcion-corta>` | Trabajo de una funcionalidad. Sale de `develop` y vuelve a `develop`.       | ❌        |
| `fix/<descripcion-corta>`     | Corrección puntual.                                                         | ❌        |
| `docs/<descripcion-corta>`    | Cambios solo de documentación.                                              | ❌        |

### Convención de nombres

```
feature/<area>-<accion>
  feature/mapa-filtros-sector
  feature/panel-verificacion-proveedor
  feature/leads-formulario
fix/<area>-<bug>
  fix/cors-frontend-origin
docs/<tema>
  docs/setup-local
```

Reglas:

- Minúsculas, separadas por guiones, en español.
- Una rama = un objetivo acotado. Evita ramas "cajón de sastre".
- `draft/ai-scaffold` es solo para **explorar**; lo válido se extrae a `feature/*` con commits
  revisados antes de integrar.

## 2. Commits (Conventional Commits)

Formato:

```
<tipo>(<alcance>): <descripción en imperativo>

[cuerpo opcional]

[footer opcional]
```

Tipos permitidos:

| Tipo       | Uso                                          |
| ---------- | -------------------------------------------- |
| `feat`     | Nueva funcionalidad.                         |
| `fix`      | Corrección de bug.                           |
| `docs`     | Documentación.                               |
| `refactor` | Cambio de código sin alterar comportamiento. |
| `chore`    | Tareas de build, deps, configuración.        |
| `test`     | Pruebas.                                     |
| `style`    | Formato, sin cambios de lógica.              |
| `perf`     | Mejoras de rendimiento.                      |

Alcances sugeridos: `frontend`, `backend`, `shared`, `supabase`, `ci`, `docs`.

### Ejemplos (español)

```
feat(mapa): agregar filtro por segmento y radio
fix(api): corregir FRONTEND_ORIGIN en CORS
docs(guias): agregar guía de despliegue en Vercel
refactor(shared): extraer schema de lead a @hvac/shared
chore(deps): actualizar maplibre-gl a 6.11
test(backend): cubrir validacion de RUT chileno
```

### Ejemplos (inglés)

```
feat(search): add nearby providers endpoint
fix(auth): reject invalid chilean phone numbers
chore(ci): cache pnpm store
```

Recomendación: usa **una sola convención por PR** (todo español o todo inglés) para mantener
consistencia.

## 3. Flujo de Pull Request

```
feature/* ──► develop ──► main
   (PR)         (PR)
```

1. Crea la rama desde `develop`: `git switch -c feature/mi-cambio develop`.
2. Desarrolla con commits atómicos y convencionales.
3. Antes de abrir el PR, ejecuta localmente:
   ```bash
   pnpm typecheck && pnpm lint && pnpm build
   pnpm test          # unit + integración (obligatorio si tocas lógica)
   pnpm format        # opcional: aplica Prettier
   ```
4. Abre el PR hacia `develop` con descripción: qué, por qué, cómo probarlo, capturas si aplica.
5. **Revisión obligatoria**: al menos **1 aprobación** de otro integrante antes de mergear.
6. CI (`verify`) debe estar verde. Usa _Squash and merge_.
7. Para llegar a `main`, abre un PR `develop → main` cuando el conjunto esté estable.

### Reglas de revisión

- Nadie mergea su propio PR sin aprobación.
- Un PR debe tener un objetivo claro y ser revisable (idealmente < 400 líneas de diff).
- Los cambios que tocan `shared/` impactan frontend y backend: require verificaciones adicionales.
- No se mergea con CI en rojo ni con conflictos sin resolver.

## 4. Pruebas

**Todo PR debe incluir pruebas** para el código que agrega o modifica, y debe pasar
`pnpm typecheck && pnpm test` en verde. Un PR sin cobertura de los cambios no se aprueba.

| Regla                    | Detalle                                                                                             |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| **Obligatorio**          | `pnpm typecheck && pnpm test` en verde antes de solicitar revisión.                                 |
| **Cobertura de cambios** | Cada nueva función, hook, servicio, endpoint o componente relevante trae al menos un test.          |
| **Bugfix**               | Un `fix/*` incluye un test que reproduce el bug y queda verde con la corrección.                    |
| **E2E**                  | Si el cambio toca un flujo crítico (búsqueda, ficha, lead, reseña, auth), agrega o ajusta un E2E.   |
| **CI**                   | `verify` ejecuta `typecheck`, `lint`, `build`, `pnpm test` y `pnpm test:e2e`. No se mergea en rojo. |
| **Commit**               | Usa el tipo `test` para commits dedicados a pruebas.                                                |

Comandos rápidos:

```bash
pnpm test                 # unit + integración de todos los paquetes
pnpm --filter @hvac/frontend test
pnpm test:e2e             # flujos end-to-end (Playwright)
```

Guía completa de estrategia, convenciones y mocks: **[docs/guias/testing.md](testing.md)**.

## 5. Estilo de código

| Regla           | Detalle                                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Formato         | **Prettier** (`.prettierrc.json`): comillas dobles, punto y coma, `printWidth` 100, `trailingComma: all`.                     |
| TypeScript      | **`strict: true`** (ver `tsconfig.base.json`).                                                                                |
| Prohibido       | `any` explícito. Usa `unknown` + validación (zod) o tipos concretos.                                                          |
| Validación      | Esquemas **zod** en `@hvac/shared` para todo input de API.                                                                    |
| Imports         | Alias `@/` en el frontend; `@hvac/shared` para código compartido.                                                             |
| Sin comentarios | No agregar comentarios salvo que aporten contexto no obvio.                                                                   |
| Nombres         | `camelCase` para variables/funciones, `PascalCase` para componentes/tipos, `kebab-case` para archivos de componentes y rutas. |
| Contratos       | Reutiliza los tipos de `ApiResponse<T>` (`{ ok, data }` / `{ ok, error }`).                                                   |

Comandos de formato:

```bash
pnpm format         # aplica Prettier a todo el repo
pnpm format:check   # verifica sin escribir (usado en CI vía `pnpm lint`)
```

> `shared/src/types/database.ts` está en `.prettierignore` porque se genera con `pnpm db:types`.

## 6. Estructura de carpetas

```
HVAC-Marketplace/
├── frontend/                  # SPA React 19 + Vite + Tailwind v4 + MapLibre
│   └── src/
│       ├── components/        # UI y layout (ui/ = primitivas tipo shadcn)
│       ├── features/          # hooks por dominio (p. ej. providers/)
│       ├── pages/             # vistas por ruta
│       ├── data/              # datos demo/fallback
│       └── lib/               # api, supabase, env, geo, utils
├── backend/                   # API Next.js 16 (route handlers) + Supabase
│   └── src/
│       ├── app/api/           # endpoints REST
│       ├── lib/               # clientes y capa de servicios
│       └── ...
├── shared/                    # @hvac/shared: zod + tipos + utilidades
│   └── src/
│       ├── schemas/           # validación de inputs
│       ├── types/             # tipos y enums de dominio
│       └── utils/             # constants, format, rut
├── supabase/                  # migraciones y seed
│   ├── migrations/
│   └── seed/
└── docs/                      # diseño, guías, ADR, entregables
```

## 7. Recetas

### Agregar un endpoint (backend)

1. Define el esquema de entrada y los tipos en `shared/src/schemas/` y `shared/src/types/`.
   Exporta desde los `index.ts` correspondientes.
2. Crea el route handler en `backend/src/app/api/<recurso>/route.ts`.
3. Valida el body/params con el schema de `@hvac/shared` y responde con `ApiResponse<T>`.
4. Consume desde el frontend con `apiFetch<T>()` (ver `frontend/src/features/*/hooks.ts`).
5. Documenta el endpoint en el README o en `docs/diseno/` si es relevante.

Ejemplo de contrato de respuesta:

```ts
// éxito
{ ok: true, data: { ... } }
// error
{ ok: false, error: { code: "validation_error", message: "...", details: {...} } }
```

### Agregar un componente (frontend)

1. Las primitivas reutilizables van en `frontend/src/components/ui/`.
2. Componentes de dominio en `frontend/src/features/<dominio>/` o `components/`.
3. Usa tokens del design system (`bg-card`, `text-muted-foreground`, `rounded-lg`), no colores
   hardcodeados. Ver [ADR-0007](../adr/0007-diseno-aire-limpio.md).
4. Accesibilidad: `aria-label` en controles, foco visible, contraste.
5. Estados de carga/errores con `Skeleton` y mensajes claros.

### Agregar una tabla (supabase)

1. Crea la migración: `npx supabase migration new <nombre>`.
2. Define la tabla, índices, y **habilita RLS** con políticas coherentes por rol
   (`cliente`, `proveedor`, `admin`).
3. Regenera tipos: `pnpm db:types`.
4. Añade datos de ejemplo en `supabase/seed/`.
5. Prueba con `pnpm db:reset` y verifica en Studio (`http://localhost:54323`).

## 8. Rama `draft/ai-scaffold`

- Es una rama de **exploración**, no una fuente de verdad.
- Puede contener código generado por asistentes de IA, prototipos y experimentos sin pulir.
- Para promover algo a producción: copia lo útil a una `feature/*` limpiando, tipando
  (sin `any`), validando con zod y aplicando Prettier.
- Nunca la mergees directamente a `develop` o `main`.
