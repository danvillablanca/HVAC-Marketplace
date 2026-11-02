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
| REQ-BUS-01 | Ubicación del cliente | A | Implementado | Geolocalización en `SearchPage` | PR-016 | No ejecutada | — |
| REQ-BUS-02 | Búsqueda por radio (PostGIS) | A | Implementado | `nearby_providers` (0008) con `ST_DWithin` acotado al radio de cobertura del proveedor. Radio por defecto de 10 km pendiente en la UI (Bloque D) | PR-017 | OK (pgTAP) | 02/11/2026 |
| REQ-BUS-03 | Filtros, orden, paginación | A | Parcial | Filtro por segmento/texto y orden distancia/rating en `SearchPage`; sin paginación ni filtro por rating/disponibilidad | PR-018 | OK filtro segmento (demo) | 02/11/2026 |
| REQ-BUS-04 | Resultados en mapa | B | Implementado | `MapView` con marcadores y clustering | PR-019 | No ejecutada | — |
| REQ-SOL-01 | Crear solicitud de servicio | A | Parcial | `request-form.tsx`, `POST /api/requests`, tabla `service_requests` (0005). Faltan tipo de servicio, geolocalización y fotos | PR-020 | OK (demo) | 02/11/2026 |
| REQ-SOL-02 | Distribución a proveedores elegibles | A | Pendiente | No existe función de elegibilidad RN-03 ni notificación a elegibles | PR-021 | No ejecutada | — |
| REQ-SOL-03 | Bandeja del proveedor | A | Parcial | `ProviderInboxPage.tsx` lista todas las solicitudes abiertas (sin elegibilidad ni filtros) | PR-022 | OK (demo, tras D-07) | 02/11/2026 |
| REQ-SOL-04 | Estados de solicitud con historial | A | Parcial | RPC `transition_request` + `service_request_events` (0005); historial en `request-detail.tsx`. La validación por rol en modo demo no existe | PR-023 | OK (demo) | 02/11/2026 |
| REQ-SOL-05 | Cancelar solicitud e historial | M | Parcial | Cancelar en `request-detail.tsx`; sin motivo ni filtro por estado | PR-024 | OK cancelar (demo) | 02/11/2026 |
| REQ-COT-01 | Cotización con monto CLP | A | Parcial | `quote-form.tsx`, `quoteCreateSchema` (monto entero >0, alcance ≥20, validez 1–30), `unique(request_id, provider_id)`. Falta paso a `vencida` | PR-025 | OK (demo) | 02/11/2026 |
| REQ-COT-02 | Comparar y aceptar cotizaciones | A | Parcial | RPC `accept_quote` rechaza el resto. Falta vista comparativa y revelar contacto (RN-10) | PR-026 | OK aceptar (demo) | 02/11/2026 |
| REQ-COT-03 | Marcar ejecución y completar | A | Parcial | Proveedor marca En ejecución → Completada. Falta confirmación del cliente y auto-confirmación | PR-027 | OK (demo) | 02/11/2026 |
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
| D-11 | Crítica | Cualquier usuario autenticado puede cambiar el estado de solicitudes ajenas | `transition_request` es `security definer` y no valida actor ni rol | Bloque E: validar actor por transición | Abierto | 02/11/2026 | — |
| D-12 | Alta | La búsqueda muestra proveedores no verificados marcados `is_demo` (incumple VER-03) | `nearby_providers` filtra `verificado or is_demo` | Solo `verificado` en SQL y en la búsqueda demo | Corregido | 02/11/2026 | Bloque C (0008) |
| D-13 | Media | `supabase start` falla con Supabase CLI v3 | `[inbucket]` ya no existe en `config.toml` | Renombrado a `[local_smtp]` | Corregido | 02/11/2026 | Bloque A |
| D-14 | Crítica | Un usuario podía hacerse admin editando su propio perfil por la API REST | La política `profiles_update_own` permitía actualizar cualquier columna, incluido `role` | `revoke update` + `grant update (full_name, phone)`; el frontend lee el rol de `profiles` y no de metadatos | Corregido | 02/11/2026 | Bloque B (0007) |
| D-15 | Alta | Los tests del frontend fallaban en CI | CI usaba Node 20 y la versión actual de jsdom requiere Node 22 | CI y `engines` en Node 22 LTS | Corregido | 02/11/2026 | 26e67e8 |
| D-16 | Alta | Los E2E fallaban en CI | Playwright pasaba el puerto por `PORT` (ignorado tras D-04) y no activaba el modo demo tras D-02 | Puertos por línea de comandos, `DEMO_MODE`/`VITE_DEMO_MODE` y `FRONTEND_ORIGIN` explícitos; textos de tests al día | Corregido | 02/11/2026 | 5f2aa94, a18fc46 |
| D-17 | Media | Crear solicitudes y aceptar cotizaciones solo exigía sesión, no rol | Rutas con `requireUser` | `requireRole(["cliente"])` en `POST /api/requests` y `PATCH /api/quotes/:id` | Corregido | 02/11/2026 | Bloque B |
| D-18 | Crítica | Con Supabase real la búsqueda fallaba siempre y el mapa quedaba sin datos | El backend llamaba `nearby_providers` con `p_query`/`p_offset` inexistentes; la RPC no devolvía coordenadas y el mapper ignoraba su lista de servicios | `nearby_providers` reescrita (texto, paginación, `lat`/`lng`, `total_count`); mapper usa `services` | Corregido | 02/11/2026 | Bloque C (0008) |
| D-19 | Crítica | Con Supabase real no se puede enviar una cotización | `POST /api/quotes` guarda el id del usuario como `provider_id`, que referencia a `providers.id` | Bloque E: resolver el proveedor del usuario | Abierto | 02/11/2026 | — |
| D-20 | Media | El dashboard del proveedor mostraba siempre "Verificado"; "Editar perfil" llevaba a `/para-proveedores`; el wizard no enviaba nada | UI de prototipo sin backend | Estado real desde `GET /api/providers/me`, enlace a `/panel/proveedor/perfil` y envío real | Corregido | 02/11/2026 | Bloque C |
| D-21 | Baja | "Para proveedores" aparecía en el navbar a usuarios con sesión | Menú sin distinción por sesión | Ítem solo para visitantes | Corregido | 02/11/2026 | Bloque C |

## 5. URL de producción y credenciales demo

| Recurso | URL |
|---|---|
| Frontend | *Pendiente de despliegue* |
| Backend API | *Pendiente de despliegue* |
| Supabase Dashboard | *Pendiente de configuración* |

**Credenciales demo:** ver `docs/guias/demo.md`.
