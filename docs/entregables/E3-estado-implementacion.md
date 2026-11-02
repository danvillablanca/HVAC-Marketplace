# E3 — Estado de Implementación y Trazabilidad

**Proyecto:** HVAC Connect (IIC3113, Grupo 1)
**Última actualización:** 02/11/2026

> Resultados "demo": ejecutados contra `DEMO_MODE=true` (sin Supabase) con un recorrido Playwright de `docs/guias/flujos-funcionales.md` (37/37 pasos OK). Aún no hay ejecución contra Supabase local (`DEMO_MODE=false`) porque falta Docker en el equipo de desarrollo.

---

## 1. Tabla de requerimientos funcionales

| ID | Resumen | Prio | Estado | Evidencia | Caso PR | Resultado | Fecha |
|---|---|---|---|---|---|---|---|
| REQ-AUT-01 | Registro con nombre, email, contraseña y rol | A | Parcial | `auth-form.tsx` + `auth-context.tsx` (Supabase `signUp` y demo). Falta consentimiento y `handle_new_user` acepta rol admin (D-05) | PR-001 | OK (demo, E2E manual) | 02/11/2026 |
| REQ-AUT-02 | Login email/contraseña | A | Parcial | `signInWithPassword` + demo; mensaje de error genérico. Falta bloqueo por intentos | PR-002 | OK (demo, E2E manual) | 02/11/2026 |
| REQ-AUT-03 | Recuperación de contraseña | M | Pendiente | — | PR-003 | No ejecutada | — |
| REQ-AUT-04 | Control de acceso por rol (rutas + RLS) | A | Parcial | `requireUser`/`requireRole` en `backend/src/lib/auth.ts` (commit 96d5388); `RequireRole` en todas las páginas `/panel/*`; RLS en `0003`/`0005`. Faltan tests 401/403 por endpoint | PR-004 | No ejecutada | — |
| REQ-AUT-05 | Logout y expiración de sesión | M | Parcial | Logout en `auth-context.tsx`; sin expiración por inactividad | PR-005 | OK logout (demo) | 02/11/2026 |
| REQ-AUT-06 | Login con Google (OAuth) | M | Pendiente | — | PR-006 | No ejecutada | — |
| REQ-PRO-01 | Editar perfil del proveedor | A | Pendiente | — | PR-007 | No ejecutada | — |
| REQ-PRO-02 | Elegir servicios desde catálogo | A | Parcial | `provider_services` en DB; sin UI de edición | PR-008 | No ejecutada | — |
| REQ-PRO-03 | Ubicación base y radio de cobertura | A | Parcial | `locations` con PostGIS; sin radio en modelo | PR-009 | No ejecutada | — |
| REQ-PRO-04 | Documentos y galería en Storage | M | Pendiente | — | PR-010 | No ejecutada | — |
| REQ-PRO-05 | Perfil público con insignia y reseñas | A | Implementado | `ProviderDetailPage`, `nearby_providers` RPC | PR-011 | No ejecutada | — |
| REQ-PRO-06 | Disponibilidad semanal | M | Pendiente | — | PR-012 | No ejecutada | — |
| REQ-VER-01 | Solicitud de verificación con documentos | A | Parcial | `verification_items` en DB; subida simulada | PR-013 | No ejecutada | — |
| REQ-VER-02 | Cola de admin, aprobar/rechazar | A | Parcial | `admin-verification-table.tsx` con datos demo | PR-014 | No ejecutada | — |
| REQ-VER-03 | Insignia "Verificado", solo verificados en búsqueda | A | Implementado | `nearby_providers` filtra por verificado | PR-015 | No ejecutada | — |
| REQ-BUS-01 | Ubicación del cliente | A | Implementado | Geolocalización en `SearchPage` | PR-016 | No ejecutada | — |
| REQ-BUS-02 | Búsqueda por radio (PostGIS) | A | Implementado | `nearby_providers` con `ST_DWithin` | PR-017 | No ejecutada | — |
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
| D-05 | Crítica | Cualquiera puede registrarse como admin vía Supabase Auth (incumple RN-01) | `handle_new_user` acepta `role = admin` desde metadatos | Bloque B: restringir a cliente/proveedor | Abierto | 02/11/2026 | — |
| D-06 | Alta | "NetworkError" al registrarse con el `.env` de ejemplo | Las claves `your-...` se tomaban como Supabase configurado | Valores `your-` cuentan como vacíos | Corregido | 02/11/2026 | 913841b |
| D-07 | Alta | En modo demo el proveedor no veía solicitudes (bandeja vacía, 403 en detalle) | El filtro demo solo permitía al cliente dueño | Regla `demoCanSee` (abiertas + cotizadas) | Corregido | 02/11/2026 | de6ae21 |
| D-08 | Media | `pnpm lint` fallaba en todos los equipos Windows | `core.autocrlf` genera CRLF y Prettier exigía LF | `endOfLine: auto` en `.prettierrc.json` | Corregido | 02/11/2026 | b6dbde8 |
| D-09 | Baja | Desde el modal de proveedor no se llegaba al perfil `/proveedor/:id` | Faltaba enlace | Botón "Ver perfil completo" | Corregido | 02/11/2026 | 7dc1afb |
| D-10 | Media | El nombre del usuario no se guarda en `profiles` al registrarse | El frontend envía `fullName` y `handle_new_user` lee `full_name` | Bloque B | Abierto | 02/11/2026 | — |
| D-11 | Crítica | Cualquier usuario autenticado puede cambiar el estado de solicitudes ajenas | `transition_request` es `security definer` y no valida actor ni rol | Bloque E: validar actor por transición | Abierto | 02/11/2026 | — |
| D-12 | Alta | La búsqueda muestra proveedores no verificados marcados `is_demo` (incumple VER-03) | `nearby_providers` filtra `verificado or is_demo` | Bloque C | Abierto | 02/11/2026 | — |
| D-13 | Media | `supabase start` falla con Supabase CLI v3 | `[inbucket]` ya no existe en `config.toml` | Renombrado a `[local_smtp]` | Corregido | 02/11/2026 | Bloque A |

## 5. URL de producción y credenciales demo

| Recurso | URL |
|---|---|
| Frontend | *Pendiente de despliegue* |
| Backend API | *Pendiente de despliegue* |
| Supabase Dashboard | *Pendiente de configuración* |

**Credenciales demo:** ver `docs/guias/demo.md`.
