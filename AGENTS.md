# AGENTS.md — Guía de continuidad de HVAC Connect

Marketplace de servicios HVAC para Chile (proyecto IIC3113, Grupo 1, cliente ASHRAE Chile).
Este archivo es el punto de partida para cualquier sesión (humana o de IA) que continúe el trabajo.
Léelo completo antes de cambiar código: resume el estado, los pendientes y las **decisiones que
mantienen la consistencia entre funcionalidades**.

Documentos relacionados (mantenlos al día al cerrar cada bloque):

- [`docs/entregables/E3-estado-implementacion.md`](docs/entregables/E3-estado-implementacion.md): estado de cada REQ, caso de prueba PR-xxx y tabla de defectos D-01…D-37.
- [`docs/entregables/E3-bitacora.md`](docs/entregables/E3-bitacora.md): qué se hizo, problemas y solución en cada bloque.
- [`docs/entregables/E3-plan-implementacion.md`](docs/entregables/E3-plan-implementacion.md): plan original de la E3.
- [`docs/guias/flujos-funcionales.md`](docs/guias/flujos-funcionales.md): flujos de usuario paso a paso (se usan para probar).
- [`docs/guias/demo.md`](docs/guias/demo.md): cuentas demo y contenido del seed.
- [`docs/guias/setup-local.md`](docs/guias/setup-local.md), [`despliegue.md`](docs/guias/despliegue.md), [`testing.md`](docs/guias/testing.md).
- [`docs/adr/`](docs/adr): decisiones de arquitectura (ADR-0008 explica el stack final frente a la E2).

---

## 1. Stack y estructura

| Parte | Tecnología | Carpeta |
| --- | --- | --- |
| Frontend | Vite + React 19 (SPA), React Router, TanStack Query, Tailwind, MapLibre | `frontend/` |
| API | Next.js 16 (solo Route Handlers en `src/app/api`) | `backend/` |
| Base de datos | Supabase (Postgres 17 + PostGIS + pgvector, Auth, Realtime) | `supabase/` |
| Compartido | Tipos, esquemas zod, catálogos y utilidades | `shared/` |
| Monorepo | pnpm 12 + Turborepo, Node **22** | raíz |

No migrar el frontend a Next.js ni cambiar el stack (ADR-0008).

## 2. Cómo levantar y verificar

```bash
pnpm install
pnpm dev                      # frontend :5173, backend :3001
pnpm db:start && pnpm db:reset   # Supabase local (Docker) con migraciones + seed
pnpm db:test                  # pruebas pgTAP (supabase/tests/), sobre base recién reseteada
pnpm typecheck && pnpm lint && pnpm test && pnpm build
pnpm test:e2e                 # Playwright en modo demo (lo mismo que CI)
```

- **Modo demo** (`DEMO_MODE=true`, `VITE_DEMO_MODE=true`, sin claves de Supabase): todo en memoria, se borra al reiniciar el backend. Las claves de ejemplo `your-...` de `.env.example` cuentan como vacías.
- **Modo real**: copiar en `.env` las claves de `npx supabase status` y poner ambos `DEMO_MODE=false` (ver `docs/guias/demo.md`).
- **Supabase oficial (nube)**: proyecto `paklzafoipzghfyftnfw` (región us-east-1); pasos en [`docs/guias/supabase-oficial.md`](docs/guias/supabase-oficial.md). Al 09/11/2026 tiene las **migraciones 0001–0012 aplicadas**, el seed original (12 servicios, 10 proveedores, 6 reseñas; comunas con tildes corregidas) y **sin cuentas de usuario**. La conexión directa `db.<ref>.supabase.co` es solo IPv6: usar el *Session pooler* (`aws-0-us-east-1.pooler.supabase.com`, usuario `postgres.<ref>`) en `SUPABASE_DB_URL` y `npx supabase db push --db-url "$SUPABASE_DB_URL"`. No correr el seed completo: chocaría con los datos existentes. "Confirm email" está activo y el correo gratuito de Supabase solo llega a miembros del equipo: para probar con cualquier correo, desactivarlo o configurar SMTP propio. Falta crear una cuenta admin (no se auto-registra, RN-01).
- Cuentas demo (contraseña `demo1234`): `cliente@demo.cl`, `cliente2@demo.cl`, `proveedor@demo.cl`, `proveedor2@demo.cl`, `admin@demo.cl`.
- Recorridos contra Supabase real: [`tests/real/`](tests/real/README.md).
- CI (`.github/workflows/ci.yml`): job `verify` (typecheck, lint, build, unit, E2E) y job `database` (Supabase + pgTAP).

## 3. Estado al 03/11/2026

Todo lo de abajo está integrado en `develop`. Detalle por requerimiento en `E3-estado-implementacion.md`.

| Bloque | Estado | Contenido |
| --- | --- | --- |
| Paso 0 | ✅ | Commits del trabajo previo, CI reparado (Node 22, Playwright), lint multiplataforma. |
| A — Datos base | ✅ | `communes` (52 RM + capitales), seed con 36 proveedores, solicitudes en todos los estados, 5 usuarios demo en `auth.users`. |
| B — Cuentas (AUT) | ✅ | Términos/privacidad, bloqueo 5 intentos/15 min, recuperación, roles, expiración 7 días, Google tras flag. |
| C — Proveedor (PRO, VER) | ✅ (PRO-04 diferido) | Perfil con servicios, cobertura, disponibilidad y horario; verificación simple; contacto oculto (RN-10). |
| D — Búsqueda (BUS) | ✅ | Comuna o geolocalización, radio 10 km, filtros, orden y paginación en servidor, mapa OSM. |
| E — Solicitudes y cotizaciones (SOL, COT) | ✅ (fotos diferidas) | Elegibilidad RN-03, bandeja limitada, comparación, aceptación, ejecución, confirmación, cancelación. |
| F — Mensajería y notificaciones (MSG, NOT) | ✅ (MSG-02 diferido) | Chat por hilo con Realtime, campana en vivo, correos (Resend) y plantillas de Auth en español. |
| **G — IA (IA-01, 02, 04)** | ⏳ **Pendiente** | Ver §5. |
| **H — Pruebas Sprint 1 y 2** | ⏳ **Pendiente** | Ver §5. |
| Sprint 3 (VAL, IA-03, ADM) | ⏳ Pendiente | Fuera del alcance de la E3 actual. |

Verificación hecha en cada bloque: unit (vitest), pgTAP, E2E demo y un recorrido contra Supabase real. Defectos D-01…D-37 están **todos corregidos**.

## 4. Decisiones que deben mantenerse (consistencia)

### 4.1 Arquitectura de datos
- El **frontend no escribe en Supabase**: usa el cliente de Supabase solo para **Auth** y **Realtime**. Todo lo demás pasa por la API (`frontend/src/lib/api.ts` → `backend/src/app/api`).
- El backend usa la **service role**. Por eso las RPC **no pueden confiar en `auth.uid()`** (es nulo con service role): toda RPC de negocio recibe el actor explícito (`p_actor uuid`), valida rol y estado dentro de una transacción y **solo `service_role` puede ejecutarla** (`revoke ... from public, anon, authenticated`). Ver `0009_requests_quotes_rules.sql`.
- **RLS**: lectura acotada para usuarios autenticados; sin `update`/`delete` directos en tablas de negocio (`service_requests`, `quotes`, eventos). Toda **transición de estado ocurre en una RPC**, nunca en el cliente.
- Evitar políticas RLS que se consulten en ciclo (provocó recursión infinita, D-24): usar una función `security definer` (p. ej. `is_awarded_provider`, `is_thread_participant`).
- **Toda tabla nueva lleva RLS** y pruebas pgTAP por rol.

### 4.2 Doble modo (demo y real)
- Cada servicio del backend tiene una rama `if (!db)` que implementa **las mismas reglas** en memoria (modo demo). Al agregar o cambiar una regla, actualiza ambas ramas y prueba la de demo con vitest y la real con pgTAP o `tests/real`.
- `getServiceClient()` devuelve `null` sin Supabase; `isDemoMode` habilita los respaldos.

### 4.3 Identidades
- **Usuario** (`auth.users.id` = `profiles.id`) y **proveedor** (`providers.id`) son distintos. Cotizaciones y mensajes referencian `providers.id`; se resuelve con `providerIdOf(user.id)` / `requireProviderId` (D-19 fue mezclarlos).
- El **rol sale siempre de `profiles`**, nunca de los metadatos de Auth (el usuario puede editarlos). Un usuario no puede cambiar su `role` (`grant update (full_name, phone)`, D-14). El admin no se auto-registra (RN-01); en OAuth el rol se elige una vez con `choose_role`.
- En modo demo `proveedor@demo.cl` (`demo-proveedor`) es dueño de la ficha `p-hogar-fresco`.

### 4.4 Reglas de negocio implementadas
- **Elegibilidad (RN-03)**: una única definición, `eligible_providers_for_request` (verificado + disponible + ofrece el servicio + la solicitud cae en su `coverage_radius_km`). En demo, `demoEligible` replica la regla. Notificación `nueva_solicitud` a cada elegible.
- **Búsqueda**: `nearby_providers` solo muestra **verificados** (VER-03) y exige que el cliente esté dentro de `least(radio buscado, cobertura del proveedor)`. Orden y paginación en el servidor (`limit` 10, `total_count`). Radio por defecto 10 km.
- **Solicitud directa** (migración 0012): pedir cotización desde el perfil de una empresa crea una `service_request` con `target_provider_id`. Solo esa empresa es elegible (verificada y con cuenta; sin exigir cobertura ni servicio) y sigue el mismo ciclo que la general. **No usar `leads`/`/api/leads`**: es del prototipo y ninguna pantalla lo lee. La solicitud general va a los proveedores elegibles, no a los administradores.
- **Ubicación**: catálogo `communes` (migración 0006) espejado en `shared/src/utils/communes.ts` (`COMMUNES`). Sin geolocalización se usa el centroide de la comuna (búsqueda y `geom` de solicitudes vía trigger).
- **Privacidad**: antes de adjudicarse, el proveedor ve solo comuna y distancia (`provider_inbox`, sin dirección ni cliente). El contacto del proveedor se muestra solo al admin, al propio proveedor o al cliente con cotización aceptada (RN-10, `canSeeContact`).
- **Estados de solicitud**: `abierta` → `con_cotizaciones` (automático con la 1.ª cotización) → `aceptada` (`accept_quote`, rechaza el resto, RN-05) → `en_ejecucion` → `completada` (solo el proveedor adjudicado) → confirmación del cliente o **automática a los 7 días, evaluada de forma perezosa** al leer (`client_confirmed_at`, sin `pg_cron`). Cancelar: solo el cliente, en `abierta`/`con_cotizaciones`, con **motivo obligatorio** de la lista `cancel_reason` (`presupuesto_alto`, `proveedor_otra_via`, `resuelto_solo`, `otro`; "otro" exige detalle). El motivo queda en `service_requests.cancel_reason`/`cancel_reason_detail`/`cancelled_at` (migración 0013, cambio de alcance sobre SOL-05); catálogo y etiquetas en `shared` (`CANCEL_REASONS`, `CANCEL_REASON_LABELS`).
- **Métricas del proveedor** (migración 0014): `request_deliveries` guarda qué solicitudes llegaron a cada proveedor (triggers al crear la solicitud y al cotizar; la bandeja en vivo no sirve como historial) y `quotes.accepted_at` se fija por trigger. RPC `provider_metrics`/`admin_cancellation_metrics`; cálculos y período de comparación en `shared/src/schemas/metrics.ts` (`previousPeriod`, `computeDeltas`), compartidos por demo y real. En demo, `demoDeliveries` en `requests.ts`.
- **Cotizaciones**: `enviada`/`aceptada`/`rechazada`/`vencida`; una activa por proveedor y solicitud (índice único parcial, RN-04); vencen perezosamente con `expire_quotes()`; el cliente puede rechazar una sola.
- **Verificación simple (decisión del cliente, 02/11)**: el proveedor declara documentos, sin subir archivos; queda `en_revision`; el admin aprueba o rechaza con motivo obligatorio (`verification_note`), queda en `audit_log` y se notifica.
- **Storage diferido (decisión del cliente)**: PRO-04 (documentos y galería), fotos de solicitud (SOL-01) y adjuntos de chat (MSG-02). No implementar sin consultar.
- **Chat**: un hilo por `(request_id, provider_id)`, habilitado desde la primera cotización; RLS de participantes; Realtime (`postgres_changes`) con polling en demo.
- **Notificaciones**: siempre vía `createNotification` (backend). Ese mismo punto envía correo por Resend para `nueva_cotizacion`, `cotizacion_aceptada`, `verificacion_aprobada` y `verificacion_rechazada`; sin `RESEND_API_KEY` solo registra en el log.
- **Auth**: login por `POST /api/auth/login` (bloqueo de 5 fallos en 15 min, regla compartida en `shared/src/utils/lockout.ts`); expiración tras 7 días sin actividad; Google oculto salvo `VITE_GOOGLE_AUTH_ENABLED=true`.

### 4.5 UI
- **Navbar por rol** (`site-header.tsx`, campo `for`): visitante y cliente ven Mapa, Buscar y Asistente ("Para proveedores" solo visitantes); proveedor ve Bandeja y Mi empresa; admin ve Verificaciones, Mapa y Buscar.
- **Panel del proveedor ≠ panel del cliente**: el del proveedor muestra su empresa, por cotizar, cotizaciones enviadas, trabajos en curso y completados (mismos grupos que la bandeja). No reutilizar componentes del panel del cliente para el proveedor.
- El panel del proveedor muestra el estado real de verificación y la tarjeta "¿Por qué no apareces en la búsqueda?".
- Textos en español de Chile, CLP con `formatCLP`, fechas `dd-mm-aaaa`.

## 5. Pendientes (en orden sugerido)

### Bloque G — IA (prioridad alta: IA-01 e IA-04)
- **IA-01**: `POST /api/ai/diagnose` (solo clientes): Gemini en el servidor con `responseMimeType: application/json` + schema; validar con zod (`serviceType` del catálogo, `urgency`, `possibleCauses[]`, `recommendations[]`, `disclaimer`). Botón "Ayúdame a describir el problema" que prellene `request-form.tsx`. Advertencia RN-09 siempre visible. Hoy solo existe el chat con reglas/Gemini en `backend/src/services/ai.ts`.
- **IA-04**: tabla `ai_usage` (20 consultas/día por usuario → 429 con mensaje claro), timeout de 10 s con `AbortController`, mensaje de contingencia y flujo manual disponible. **Sin `GEMINI_API_KEY` responder con la contingencia, no con texto inventado**; tests con mocks.
- **IA-02**: columna `embedding vector(1536)` en `providers` (`gemini-embedding-001`, `outputDimensionality = GEMINI_EMBEDDING_DIM`), script `scripts/embed-providers.ts`, recálculo al editar el perfil, RPC `match_providers(query_embedding, lat, lng, radius)` con filtro geográfico y solo verificados; búsqueda en texto libre en la UI.
- Actualizar ADR-0006 con el nuevo alcance.

### Bloque H — Pruebas de Sprint 1 y 2
- Al menos una prueba automatizada por caso **PR-001 a PR-031, PR-035 y PR-036**, con el ID en el nombre del test (ya hay muchas: busca `PR-0` en el repo).
- Pruebas RLS por rol (cliente, proveedor, admin, anónimo) para **cada tabla nueva o modificada**.
- Ejecutar todo con `DEMO_MODE=false` contra Supabase local y registrar en `E3-estado-implementacion.md`: resultado, fecha y defectos.
- Marcar lo no logrado como **Diferido** con su justificación (va a la Solicitud de Cambio). Ya diferidos: PRO-04, fotos de SOL-01, MSG-02.

### Otros pendientes
- Probar Google OAuth con credenciales reales (pasos en `docs/guias/despliegue.md`).
- Vista previa del radio de cobertura sobre el mapa en el perfil del proveedor (hoy es texto).
- Despliegue (Vercel + Supabase Cloud) y actualizar la matriz de trazabilidad.
- Sprint 3: VAL-01 (reseña solo con solicitud completada y confirmada; ya existe el enlace "Deja tu reseña"), VAL-03, IA-03, ADM-01..04.

## 6. Forma de trabajo acordada
- Prioridad del cliente: **funcionalidad visible y demostrable antes que sofisticación** (sin sobreingeniería).
- Un bloque por rama `feature/<bloque>`; cada bloque cierra con: tests (unit + pgTAP + E2E demo), recorrido contra Supabase real, actualización de `E3-estado-implementacion.md` (REQ y defectos), `E3-bitacora.md` y `flujos-funcionales.md`, y **CI verde**.
- Commits convencionales en español (`feat(api): ...`, `fix(ui): ...`, `docs: ...`, `test(db): ...`).
- **No hacer push sin que lint, typecheck, test y build pasen** (revisar los códigos de salida, no solo la salida filtrada).
- Migraciones nuevas: siguiente número disponible (la última es `0014_provider_metrics.sql`); nunca editar una migración ya integrada en `develop`.

## 7. Problemas conocidos del entorno
- **Windows + CRLF**: `core.autocrlf=true`; Prettier usa `endOfLine: auto`. No cambiarlo.
- **Node 22** obligatorio (jsdom actual no corre en Node 20).
- **Next.js 16** no permite dos `next dev` en la misma carpeta; Playwright pasa el puerto por línea de comandos (`playwright.config.ts`).
- **Supabase CLI v3**: `[local_smtp]` en vez de `[inbucket]`; `auth.email.enabled` en vez de `enable_signup`. Mailpit en `http://127.0.0.1:54324`.
- `git worktree` dentro de rutas largas falla con pnpm en Windows: usar rutas cortas (p. ej. `%TEMP%\hvwt`). La limpieza de `%TEMP%` puede dañar su `node_modules` (reinstalar con `pnpm install --force`).
- Las pruebas pgTAP suponen el seed: correrlas tras `pnpm db:reset`.
- Los tests del frontend con `userEvent` tienen `testTimeout` de 15 s (equipos cargados).
- Para quitar tildes usar `normalize("NFD").replace(/[\u0300-\u036f]/g, "")` escrito con escapes; algunos editores insertan los caracteres combinantes literales (invisibles).
