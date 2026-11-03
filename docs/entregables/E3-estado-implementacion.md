# E3 — Estado de Implementación y Trazabilidad

**Proyecto:** HVAC Connect (IIC3113, Grupo 1)
**Última actualización:** 02/11/2026

> Resultados "demo": ejecutados contra `DEMO_MODE=true` (sin Supabase) con un recorrido Playwright de `docs/guias/flujos-funcionales.md` (37/37 pasos OK). Aún no hay ejecución contra Supabase local (`DEMO_MODE=false`) porque falta Docker en el equipo de desarrollo.

---

## 1. Tabla de requerimientos funcionales

| ID | Resumen | Prio | Estado | Evidencia | Caso PR | Resultado | Fecha |
|---|---|---|---|---|---|---|---|
| REQ-AUT-01 | Registro con nombre, email, contraseña y rol | A | Implementado | `auth-form.tsx` (checkbox de términos, solo cliente/proveedor), `/terminos`, `/privacidad`, `accepted_terms_at` y `handle_new_user` con RN-01 (`0007`) | PR-001 | OK (Supabase local) | 02/11/2026 |
| REQ-AUT-02 | Login email/contraseña | A | Implementado | `POST /api/auth/login` con mensaje genérico y bloqueo de 5 fallos en 15 min (`login_attempts`, `shared/utils/lockout.ts`) | PR-002 | OK (Supabase local) | 02/11/2026 |
| REQ-AUT-03 | Recuperación de contraseña | M | Implementado | `/recuperar` (`resetPasswordForEmail`) y `/restablecer` con `passwordResetSchema`. Correo en inglés hasta NOT-02 | PR-003 | OK (Supabase local + Mailpit) | 02/11/2026 |
| REQ-AUT-04 | Control de acceso por rol (rutas + RLS) | A | Implementado | `RequireRole` en todas las rutas `/panel/*` (`panel-routes.test.tsx`), 401/403 por endpoint (`access-control.test.ts`), rol leído desde `profiles`, rol inmutable para el usuario (D-14) | PR-004 | OK | 02/11/2026 |
| REQ-AUT-05 | Logout y expiración de sesión | M | Implementado | `signOut` revoca la sesión en Supabase; `[auth.sessions] inactivity_timeout = 168h` y chequeo de última actividad en `auth-context.tsx` | PR-005 | OK (Supabase local) | 02/11/2026 |
| REQ-AUT-06 | Login con Google (OAuth) | M | Implementado (sin credenciales) | Botón tras `VITE_GOOGLE_AUTH_ENABLED`, `/elegir-rol` + RPC `choose_role`; pasos en `despliegue.md`. Falta probar con credenciales reales de Google | PR-006 | OK con mocks; flujo real no ejecutado | 02/11/2026 |
| REQ-PRO-01 | Editar perfil del proveedor | A | Implementado | `/panel/proveedor/perfil` (`provider-profile-form.tsx`), `PUT /api/providers/me` con `providerProfileSchema` (descripción ≤1.000, teléfono, correo, experiencia, web) | PR-007 | OK (Supabase local) | 02/11/2026 |
| REQ-PRO-02 | Elegir servicios desde catálogo | A | Implementado | Selector del catálogo (`GET /api/catalog/services`) con precio desde; se guarda en `provider_services` | PR-008 | OK (Supabase local) | 02/11/2026 |
| REQ-PRO-03 | Ubicación base y radio de cobertura | A | Implementado | Comuna base (centroide de `communes`) y radio 1–100 km en `coverage_radius_km`. Sin vista previa del círculo en el mapa (solo texto) | PR-009 | OK (Supabase local) | 02/11/2026 |
| REQ-PRO-04 | Documentos y galería en Storage | M | Diferido | Por decisión del cliente (02/11) la verificación se mantiene simple: se declaran los documentos sin subir archivos. Buckets `provider-docs` y `provider-gallery` quedan para la Solicitud de Cambio | PR-010 | No ejecutada | — |
| REQ-PRO-05 | Perfil público con insignia y reseñas | A | Implementado | Contacto oculto hasta cotización aceptada (RN-10) en `GET /api/providers/:id` (`canSeeContact`); aviso en modal y página. Sin galería (ver PRO-04) | PR-011 | OK (Supabase local) | 02/11/2026 |
| REQ-PRO-06 | Disponibilidad semanal | M | Implementado | Horario semanal (`weekly_hours`) y switch disponible/no disponible. La exclusión en la distribución de solicitudes se aplica en el Bloque E (SOL-02) | PR-012 | OK (Supabase local) | 02/11/2026 |
| REQ-VER-01 | Solicitud de verificación con documentos | A | Implementado (versión simple) | Wizard toma los datos del perfil y declara documentos; `POST /api/providers/me/verification` deja `en_revision` y crea `verification_items`. Sin archivos (ver PRO-04) | PR-013 | OK (Supabase local) | 02/11/2026 |
| REQ-VER-02 | Cola de admin, aprobar/rechazar | A | Implementado | Cola real ordenada por antigüedad; motivo obligatorio al rechazar (`verification_note`); `audit_log` y notificación al proveedor | PR-014 | OK (Supabase local) | 02/11/2026 |
| REQ-VER-03 | Insignia "Verificado", solo verificados en búsqueda | A | Implementado | `nearby_providers` y la búsqueda demo filtran solo verificados (D-12); el dashboard muestra el estado real | PR-015 | OK (pgTAP + Supabase local) | 02/11/2026 |
| REQ-BUS-01 | Ubicación del cliente | A | Implementado | Geolocalización o selector región → comuna (centroide de `COMMUNES`) en `SearchPage` | PR-016 | OK (Supabase local) | 02/11/2026 |
| REQ-BUS-02 | Búsqueda por radio (PostGIS) | A | Implementado | `nearby_providers` con `ST_DWithin` acotado al radio de cobertura del proveedor; radio por defecto 10 km, ajustable 1–100 | PR-017 | OK (pgTAP + Supabase local) | 02/11/2026 |
| REQ-BUS-03 | Filtros, orden, paginación | A | Implementado | Servicio, calificación mínima, solo disponibles, segmento y texto; orden por distancia o calificación en el servidor; páginas de 10 con total (`0010`) | PR-018 | OK (pgTAP + Supabase local) | 02/11/2026 |
| REQ-BUS-04 | Resultados en mapa | B | Implementado | MapLibre con teselas raster de OpenStreetMap por defecto y MapTiler si hay `VITE_MAPTILER_KEY`; marcadores con resumen | PR-019 | OK (Supabase local) | 02/11/2026 |
| REQ-SOL-01 | Crear solicitud de servicio | A | Implementado (sin fotos) | `request-form.tsx`: servicio del catálogo, equipo, descripción 20–1.000, urgencia, comuna o geolocalización; `geom` desde la comuna (trigger 0009). Fotos diferidas (Storage) | PR-020 | OK (Supabase local) | 02/11/2026 |
| REQ-SOL-02 | Distribución a proveedores elegibles | A | Implementado | `eligible_providers_for_request` (RN-03), notificación `nueva_solicitud` a cada elegible; `provider_inbox` sin dirección ni cliente + RLS `requests_awarded_provider_select` | PR-021 | OK (Supabase local + pgTAP) | 02/11/2026 |
| REQ-SOL-03 | Bandeja del proveedor | A | Implementado | `ProviderInboxPage`: disponibles / cotizadas / mis trabajos, filtros por urgencia y servicio, orden por fecha; excluye canceladas y adjudicadas a otro | PR-022 | OK (Supabase local) | 02/11/2026 |
| REQ-SOL-04 | Estados de solicitud con historial | A | Implementado | RPC `transition_request`, `accept_quote`, `create_quote` y `confirm_completion` con actor y rol (D-11/D-22); historial en el detalle | PR-023 | OK (Supabase local + pgTAP) | 02/11/2026 |
| REQ-SOL-05 | Cancelar solicitud e historial | M | Implementado | Cancelación solo del cliente en Abierta/Con cotizaciones, motivo opcional, aviso a quienes cotizaron; filtro por estado en el historial | PR-024 | OK (Supabase local) | 02/11/2026 |
| REQ-COT-01 | Cotización con monto CLP | A | Implementado | `create_quote`: solo elegibles y solicitudes abiertas; índice único parcial (RN-04); `expire_quotes` pasa a `vencida` al leer o aceptar | PR-025 | OK (Supabase local + pgTAP) | 02/11/2026 |
| REQ-COT-02 | Comparar y aceptar cotizaciones | A | Implementado | Tabla comparativa (monto, IVA, plazo, vigencia, calificación, distancia, menor precio); aceptar rechaza el resto (RN-05), revela el contacto (RN-10) y notifica a todos; también rechazar | PR-026 | OK (Supabase local) | 02/11/2026 |
| REQ-COT-03 | Marcar ejecución y completar | A | Implementado | Proveedor adjudicado marca En ejecución → Completada; el cliente confirma; auto-confirmación perezosa a los 7 días (sin `pg_cron`); la confirmación habilita el enlace a la reseña | PR-027 | OK (Supabase local) | 02/11/2026 |
| REQ-MSG-01 | Chat en tiempo real | M | Pendiente | — | PR-028 | No ejecutada | — |
| REQ-MSG-02 | Adjuntos de imagen | B | Pendiente | — | PR-029 | No ejecutada | — |
| REQ-NOT-01 | Campana con notificaciones | M | Parcial | `notification-bell.tsx` + `/api/notifications` con polling 15–30 s; sin Realtime | PR-030 | OK (demo) | 02/11/2026 |
| REQ-NOT-02 | Correos transaccionales | M | Pendiente | — | PR-031 | No ejecutada | — |
| REQ-VAL-01 | Reseña 1–5 solo si Completada | A | Parcial | `reviews` en DB; sin restricción por estado | PR-032 | No ejecutada | — |
| REQ-VAL-02 | Promedio y conteo automáticos | A | Implementado | Trigger `increment_provider_reviews` | PR-033 | No ejecutada | — |
| REQ-VAL-03 | Respuesta del proveedor | B | Pendiente | — | PR-034 | No ejecutada | — |
| REQ-IA-01 | Diagnóstico asistido con IA | A | Parcial | Chat con Gemini y fallback por reglas en `services/ai.ts`; sin diagnóstico estructurado ni prellenado | PR-035 | OK chat por reglas (demo) | 02/11/2026 |
| REQ-IA-02 | Búsqueda semántica | M | Pendiente | `match_documents` RPC existe; sin endpoint | PR-036 | No ejecutada | — |
| REQ-IA-03 | Asistente RAG | M | Pendiente | Stub | PR-037 | No ejecutada | — |
| REQ-IA-04 | Rate limit IA y contingencia | A | Pendiente | — | PR-038 | No ejecutada | — |
| REQ-ADM-01 | Listar/suspender usuarios | M | Pendiente | — | PR-039 | No ejecutada | — |
| REQ-ADM-02 | Moderar reseñas | M | Pendiente | — | PR-040 | No ejecutada | — |
| REQ-ADM-03 | Panel de métricas | M | Pendiente | — | PR-041 | No ejecutada | — |
| REQ-ADM-04 | Catálogo y documentos RAG | M | Pendiente | `categories`, `services` en DB; sin UI admin | PR-042 | No ejecutada | — |

## 2. Requerimientos no funcionales

| ID | Resumen | Estado | Evidencia | Resultado |
|---|---|---|---|---|
| RNF-01 | Búsqueda ≤2 s p95 | Pendiente | — | No ejecutada |
| RNF-04 | HTTPS, RLS, sin secretos en cliente, validación zod | Parcial | RLS ok, zod ok, JWT validado en backend; falta D-05 | No ejecutada |
| RNF-05 | Consentimiento, privacidad, eliminación | Pendiente | — | No ejecutada |
| RNF-06 | Responsiva desde 360 px | Parcial | Tailwind responsive; sin auditoría | No ejecutada |
| RNF-07 | Lighthouse accesibilidad ≥90 | Pendiente | — | No ejecutada |
| RNF-10 | TypeScript strict y CI verde | Implementado | `tsconfig.json` strict, CI pasa | OK |
| RNF-11 | Español Chile, CLP, dd/mm/aaaa, America/Santiago | Parcial | Formatos en `shared/utils`; sin auditoría completa | No ejecutada |

## 3. Cambios de alcance respecto de E2

| Cambio | E2 (propuesto) | Implementado | Justificación | Solicitud de Cambio |
|---|---|---|---|---|
| Stack frontend | Next.js full-stack (SSR/SSG) | Vite SPA (React 19) | ADR-0008: despliegue estático más simple, HMR rápido, separación clara | Pendiente |
| Mapa | Leaflet/OpenStreetMap | MapLibre GL JS + OSM/MapTiler | ADR-0008: WebGL, clustering nativo, mejor rendimiento | Pendiente |
| Módulo IA | Completo (diagnóstico + RAG + asistente) | Diagnóstico asistido; RAG y asistente diferidos | Priorización por tiempo; ADR-0006 actualizado | Pendiente |
| Monorepo | No especificado | pnpm 12 + Turborepo | Mejora de DX y compartición de tipos | Informativo |

## 4. Defectos encontrados y corregidos

| ID | Severidad | Descripción | Causa | Solución | Estado | Fecha | Commit |
|---|---|---|---|---|---|---|---|
| D-01 | Crítica | El backend no validaba JWT en endpoints protegidos | No existía middleware de auth | `requireUser`/`requireRole` en `backend/src/lib/auth.ts` | Corregido | 01/11/2026 | 96d5388 |
| D-02 | Alta | El modo demo se activaba en silencio sin variable de control | Fallback implícito sin Supabase | `DEMO_MODE`/`VITE_DEMO_MODE` explícitos | Corregido | 01/11/2026 | 913841b |
| D-03 | Media | Seed insuficiente (10 proveedores, sin usuarios en `auth.users`) | Seed inicial mínimo | Seed con 36 proveedores, comunas, solicitudes en 6 estados y 5 usuarios demo; pruebas pgTAP | Corregido | 02/11/2026 | Bloque A |
| D-04 | Alta | `npm run dev` fallaba en Windows | `next dev -p ${PORT:-3001}` es sintaxis bash | Puerto fijo `-p 3001` | Corregido | 02/11/2026 | b6dbde8 |
| D-05 | Crítica | Cualquiera puede registrarse como admin vía Supabase Auth (incumple RN-01) | `handle_new_user` acepta `role = admin` desde metadatos | `handle_new_user` solo acepta cliente/proveedor; `registerSchema` sin admin | Corregido | 02/11/2026 | Bloque B (0007) |
| D-06 | Alta | "NetworkError" al registrarse con el `.env` de ejemplo | Las claves `your-...` se tomaban como Supabase configurado | Valores `your-` cuentan como vacíos | Corregido | 02/11/2026 | 913841b |
| D-07 | Alta | En modo demo el proveedor no veía solicitudes (bandeja vacía, 403 en detalle) | El filtro demo solo permitía al cliente dueño | Regla `demoCanSee` (abiertas + cotizadas) | Corregido | 02/11/2026 | de6ae21 |
| D-08 | Media | `pnpm lint` fallaba en todos los equipos Windows | `core.autocrlf` genera CRLF y Prettier exigía LF | `endOfLine: auto` en `.prettierrc.json` | Corregido | 02/11/2026 | b6dbde8 |
| D-09 | Baja | Desde el modal de proveedor no se llegaba al perfil `/proveedor/:id` | Faltaba enlace | Botón "Ver perfil completo" | Corregido | 02/11/2026 | 7dc1afb |
| D-10 | Media | El nombre del usuario no se guarda en `profiles` al registrarse | El frontend envía `fullName` y `handle_new_user` lee `full_name` | `handle_new_user` lee `fullName`, `full_name` o `name` | Corregido | 02/11/2026 | Bloque B (0007) |
| D-11 | Crítica | Cualquier usuario autenticado puede cambiar el estado de solicitudes ajenas | `transition_request` es `security definer` y no valida actor ni rol | Reglas por transición con actor explícito en la RPC | Corregido | 02/11/2026 | Bloque E (0009) |
| D-12 | Alta | La búsqueda muestra proveedores no verificados marcados `is_demo` (incumple VER-03) | `nearby_providers` filtra `verificado or is_demo` | Solo `verificado` en SQL y en la búsqueda demo | Corregido | 02/11/2026 | Bloque C (0008) |
| D-13 | Media | `supabase start` falla con Supabase CLI v3 | `[inbucket]` ya no existe en `config.toml` | Renombrado a `[local_smtp]` | Corregido | 02/11/2026 | Bloque A |
| D-14 | Crítica | Un usuario podía hacerse admin editando su propio perfil por la API REST | La política `profiles_update_own` permitía actualizar cualquier columna, incluido `role` | `revoke update` + `grant update (full_name, phone)`; el frontend lee el rol de `profiles` y no de metadatos | Corregido | 02/11/2026 | Bloque B (0007) |
| D-15 | Alta | Los tests del frontend fallaban en CI | CI usaba Node 20 y la versión actual de jsdom requiere Node 22 | CI y `engines` en Node 22 LTS | Corregido | 02/11/2026 | 26e67e8 |
| D-16 | Alta | Los E2E fallaban en CI | Playwright pasaba el puerto por `PORT` (ignorado tras D-04) y no activaba el modo demo tras D-02 | Puertos por línea de comandos, `DEMO_MODE`/`VITE_DEMO_MODE` y `FRONTEND_ORIGIN` explícitos; textos de tests al día | Corregido | 02/11/2026 | 5f2aa94, a18fc46 |
| D-17 | Media | Crear solicitudes y aceptar cotizaciones solo exigía sesión, no rol | Rutas con `requireUser` | `requireRole(["cliente"])` en `POST /api/requests` y `PATCH /api/quotes/:id` | Corregido | 02/11/2026 | Bloque B |
| D-18 | Crítica | Con Supabase real la búsqueda fallaba siempre y el mapa quedaba sin datos | El backend llamaba `nearby_providers` con `p_query`/`p_offset` inexistentes; la RPC no devolvía coordenadas y el mapper ignoraba su lista de servicios | `nearby_providers` reescrita (texto, paginación, `lat`/`lng`, `total_count`); mapper usa `services` | Corregido | 02/11/2026 | Bloque C (0008) |
| D-19 | Crítica | Con Supabase real no se puede enviar una cotización | `POST /api/quotes` guarda el id del usuario como `provider_id`, que referencia a `providers.id` | El backend resuelve el proveedor del usuario y cotiza vía `create_quote` | Corregido | 02/11/2026 | Bloque E |
| D-20 | Media | El dashboard del proveedor mostraba siempre "Verificado"; "Editar perfil" llevaba a `/para-proveedores`; el wizard no enviaba nada | UI de prototipo sin backend | Estado real desde `GET /api/providers/me`, enlace a `/panel/proveedor/perfil` y envío real | Corregido | 02/11/2026 | Bloque C |
| D-21 | Baja | "Para proveedores" aparecía en el navbar a usuarios con sesión | Menú sin distinción por sesión | Ítem solo para visitantes | Corregido | 02/11/2026 | Bloque C |
| D-22 | Crítica | Las RPC no validaban al usuario: cualquiera podía aceptar cotizaciones ajenas a través del backend | Validaban con `auth.uid()`, que es nulo con la service role que usa el backend | RPC con actor explícito, ejecutables solo por `service_role` | Corregido | 02/11/2026 | Bloque E (0009) |
| D-23 | Crítica | Un cliente podía cambiar el estado de su solicitud y un proveedor insertar una cotización "aceptada" directo por REST | Políticas `for all` en `service_requests` y `quotes` | Solo lectura acotada + inserción de solicitud propia; cambios únicamente por RPC | Corregido | 02/11/2026 | Bloque E (0009) |
| D-24 | Alta | Recursión infinita en RLS al leer solicitudes con sesión de usuario | La política de solicitudes consultaba `quotes` y la de `quotes` consultaba `service_requests` | Función `security definer` `is_awarded_provider` | Corregido (detectado por pgTAP antes del commit) | 02/11/2026 | Bloque E (0009) |
| D-25 | Media | El proveedor adjudicado no veía la dirección del cliente con Supabase real | El detalle usaba la fila limitada de la bandeja también tras adjudicar | Fila completa para el adjudicado | Corregido (detectado en E2E real) | 02/11/2026 | 494013e |
| D-26 | Baja | El seed hacía cotizar a `proveedor2@demo.cl` servicios que no ofrecía | Servicios aleatorios en el generador del seed | Servicios y radio coherentes con RN-03 | Corregido | 02/11/2026 | Bloque E |
| D-27 | Media | Una empresa nueva no se ve en `/buscar` y el proveedor no sabe por qué (reportado por el cliente) | La búsqueda muestra solo verificados (VER-03) y dentro de la cobertura (BUS-02), pero el panel no lo explicaba | Tarjeta "¿Por qué no apareces en la búsqueda?" con los requisitos pendientes y búsqueda desde cualquier comuna | Corregido | 02/11/2026 | Bloque D |
| D-28 | Alta | En modo demo el admin no podía aprobar ni rechazar a ningún proveedor, y la tabla no mostraba el error | `verificationDecisionSchema` exigía UUID y los ids demo son tipo `p-clima-andes` | `providerId` acepta ids de 3–100 caracteres, perfiles demo con UUID y error visible en la tabla | Corregido | 02/11/2026 | 516f373 |
| D-29 | Media | "Hogar Fresco Instalaciones" aparecía duplicado en la búsqueda demo | El perfil demo de `proveedor@demo.cl` usaba un id distinto al de la ficha existente | Reutiliza `p-hogar-fresco` y conserva su calificación | Corregido | 02/11/2026 | Bloque D |
| D-30 | Media | La búsqueda ignoraba el servicio y la página pedidos | El hook del frontend no enviaba `serviceId` ni `offset` | Hook reescrito con todos los filtros | Corregido | 02/11/2026 | Bloque D |
| D-31 | Baja | El contador de los clústeres del mapa no cargaba sus fuentes (404) | El estilo usado no tenía glifos para la fuente pedida | Estilo raster OSM con `glyphs` y `text-font` explícitos | Corregido | 02/11/2026 | Bloque D |

## 5. URL de producción y credenciales demo

| Recurso | URL |
|---|---|
| Frontend | *Pendiente de despliegue* |
| Backend API | *Pendiente de despliegue* |
| Supabase Dashboard | *Pendiente de configuración* |

**Credenciales demo:** ver `docs/guias/demo.md`.
