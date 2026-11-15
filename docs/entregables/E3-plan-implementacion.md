# E3 — Plan de Implementación

**Proyecto:** HVAC Connect (IIC3113, Grupo 1)
**Fecha:** 01/11/2026
**Congelamiento de código:** 09/11/2026
**Corte de métricas:** 10/11/2026
**Entrega 3 (demo en vivo):** 24/11/2026

---

## Diagnóstico del estado actual (01/11/2026)

| Aspecto | Estado |
|---|---|
| Monorepo (pnpm 12 + Turborepo) | OK |
| Frontend (React 19 + Vite SPA + Tailwind v4 + MapLibre + TanStack Query) | OK |
| Backend (Next.js 16, solo Route Handlers) | OK |
| Shared (zod schemas + tipos) | OK |
| Supabase (4 migraciones, seed con 10 proveedores) | OK |
| CI (GitHub Actions: typecheck + lint + build + test + e2e) | OK |
| Tests (527 tests, Vitest) | OK |
| Búsqueda geoespacial (nearby_providers, PostGIS) | OK |
| RLS en todas las tablas | OK |
| Auth JWT en endpoints del backend | **NO — ningún endpoint valida JWT** |
| Modo demo | **Silencioso — sin variable de control** |
| Solicitudes de servicio y cotizaciones | **No existe en el modelo** |
| Notificaciones, chat en tiempo real | **No implementado** |
| IA (diagnóstico, RAG) | **Stub solamente** |
| Panel de admin con datos reales | **Hardcodeado** |
| Despliegue a producción | **No desplegado** |
| Branding | "Marketplace HVAC" — debe ser "HVAC Connect" |

---

## Fase 0 — Seguridad y base para producción

**Prioridad:** Hacer primero. Sin esto, nada puede ir a producción.

### 0.1 Middleware de autenticación en el backend
- Crear `backend/src/lib/auth.ts` con `requireUser(req)` y `requireRole(req, roles)`.
- Valida el `Bearer` JWT de Supabase Auth contra `auth.getUser()`.
- Lee el rol desde `profiles`.
- Aplicar a todos los endpoints de escritura (`POST /api/leads`, `POST /api/reviews`, `PATCH /api/leads/[id]`, etc.) y a los de admin (`/api/admin/*`).
- El frontend envía `Authorization: Bearer <token>` en `apiFetch`.

### 0.2 Cliente Supabase con JWT del usuario
- Crear `getUserClient(token)` que usa el anon key + el JWT del usuario para que las políticas RLS apliquen correctamente.
- La service role queda solo para tareas de sistema (triggers, funciones admin).

### 0.3 Modo demo detrás de variable
- `VITE_DEMO_MODE=true` en el frontend, `DEMO_MODE=true` en el backend.
- Si la variable no está activa, los fallbacks a datos demo no se ejecutan; la UI muestra errores reales.

### 0.4 Configuración de despliegue SPA
- Crear `frontend/vercel.json` con rewrite SPA a `index.html`.
- Revisar CORS para aceptar `FRONTEND_ORIGIN` (lista separada por comas).

### 0.5 Rebranding a "HVAC Connect"
- Renombrar todas las instancias de "Marketplace HVAC" a "HVAC Connect" en el código, HTML, componentes y documentación.

### 0.6 MapLibre con teselas OSM por defecto
- Si existe `VITE_MAPTILER_KEY`, usar MapTiler. Si no, usar teselas raster de OpenStreetMap (`tile.openstreetmap.org`).
- La app nunca debe quedar sin mapa.

### 0.7 Seed ampliado
- ≥30 proveedores verificados en distintas comunas de Santiago y regiones.
- Servicios variados, reseñas, solicitudes en distintos estados.
- Usuarios demo para los 3 roles con credenciales documentadas en `docs/guias/demo.md`.

### 0.8 ADR-0008 Stack final vs E2
- Documentar la justificación técnica del stack actual (Vite SPA + API Next.js) vs. lo que decía el documento E2 (Next.js full-stack + Leaflet).

**Criterio de salida:** CI verde, todos los endpoints protegidos validan JWT, modo demo controlado por variable, seed ampliado.

---

## Fase 1 — Flujo core del marketplace

**Prioridad:** Alta. Es el corazón del MVP.

### 1.1 Migración `0005_service_requests_quotes.sql`
- Nuevos tipos: `request_status` (abierta, con_cotizaciones, aceptada, en_ejecucion, completada, cancelada), `quote_status` (enviada, aceptada, rechazada, vencida), `equipment_type`, `urgency_level`.
- Tabla `service_requests`: tipo de servicio, equipo, descripción, urgencia, ubicación (geom), fotos, estado, cliente, timestamps.
- Tabla `service_request_events`: historial de transiciones con actor y motivo.
- Tabla `quotes`: monto CLP, IVA, alcance, plazo, validez, estado, proveedor, solicitud.
- Campos en `providers`: `is_available boolean`, `weekly_hours jsonb`, `coverage_radius_km integer`.
- RLS para cada tabla nueva.
- RPCs transaccionales:
  - `eligible_providers_for_request(request_id)` — RN-03.
  - `accept_quote(quote_id)` — acepta una, rechaza el resto.
  - `transition_request(request_id, new_status)` — valida rol y estado de origen.

### 1.2 Endpoints REST y schemas zod
- `POST /api/requests` — crear solicitud.
- `GET /api/requests` — listar solicitudes del usuario (cliente ve las suyas, proveedor ve las elegibles).
- `GET /api/requests/[id]` — detalle con cotizaciones.
- `PATCH /api/requests/[id]/status` — transición de estado.
- `POST /api/requests/[id]/quotes` — enviar cotización.
- `PATCH /api/quotes/[id]/accept` — aceptar cotización.
- `PATCH /api/quotes/[id]` — actualizar cotización.
- Schemas en `@hvac/shared`: `serviceRequestCreateSchema`, `quoteCreateSchema`, `transitionSchema`.

### 1.3 UI cliente
- Formulario de solicitud (desde ficha del proveedor y de forma general).
- Panel "Mis solicitudes" con datos reales, filtro por estado.
- Comparación lado a lado de cotizaciones.
- Aceptar cotización, cancelar solicitud.

### 1.4 UI proveedor
- Bandeja de solicitudes elegibles (sin dirección ni contacto antes de aceptar — RN-10).
- Enviar cotización con monto CLP, alcance, plazo.
- Marcar En ejecución → Completada.
- Editar perfil: nombre comercial, descripción, teléfono, email, años de experiencia, web, servicios, ubicación, radio, disponibilidad.

### 1.5 Verificación real
- Bucket privado `verification-docs` en Supabase Storage con políticas.
- Subida real de documentos desde el wizard (PDF/JPG/PNG, ≤5 MB, máx. 5).
- Cola de admin con datos reales; aprobar o rechazar con motivo y registro en `audit_log`.

### 1.6 Reseñas mejoradas
- Solo para solicitudes Completadas del propio cliente, una por servicio.
- El trigger de promedio excluye reseñas ocultas (`is_hidden`).
- Respuesta del proveedor (≤500 caracteres).
- Editable durante 48 h.

**Criterio de salida:** CI verde. El flujo solicitud → cotización → aceptación → ejecución → completada → reseña funciona end-to-end contra Supabase.

---

## Fase 2 — Comunicación e IA

### 2.1 Notificaciones
- Tabla `notifications` con tipo, destinatario, referencia, leído/no leído.
- Campana con contador de no leídas en el header.
- Supabase Realtime para push en tiempo real.
- Eventos generados desde las RPCs y endpoints de la Fase 1.

### 2.2 Chat por solicitud
- Adaptar tabla `messages` existente a `request_id` en vez de `lead_id`.
- Supabase Realtime para mensajes en tiempo real.
- Adjuntos de imagen opcionales (≤5 MB).

### 2.3 IA — Diagnóstico asistido (REQ-IA-01 + IA-04)
- Endpoint `POST /api/ai/diagnose` con Gemini (`@google/genai`).
- Salida JSON validada con zod: servicio sugerido, urgencia, causas orientativas.
- Rate limit de 20/día por usuario (tabla `ai_usage`), timeout de 10 s.
- Botón "Ayúdame a describir el problema" que prellena la solicitud.
- Advertencia RN-09 visible.
- Contingencia: si Gemini no responde o no hay key, mensaje claro y flujo manual.
- Actualizar ADR-0006.

### 2.4 Búsqueda semántica (si queda tiempo)
- pgvector + embeddings Gemini.
- `document_chunks` y `match_documents` ya existen; conectar con endpoint.

**Criterio de salida:** CI verde. Notificaciones llegan en tiempo real, chat funciona, el diagnóstico IA prellena el formulario.

---

## Fase 3 — Administración, cuentas y no funcionales

### 3.1 Admin
- Listado y búsqueda de usuarios, suspender/reactivar con motivo (RN-11).
- Moderación de reseñas: ocultar/restaurar con motivo, registrado en `audit_log` (RN-12).
- Panel de métricas: usuarios por rol, solicitudes por estado, cotizaciones/solicitud, tasa de aceptación, tiempo a primera cotización, rating promedio. Exportación CSV.

### 3.2 Cuentas
- Recuperación de contraseña (AUT-03): link de 60 min, un solo uso.
- Expiración de sesión: 7 días de inactividad (AUT-05).
- Página de términos y política de privacidad, checkbox en registro (RNF-05).
- Eliminar cuenta.
- Google OAuth (AUT-06): si la configuración de Supabase lo permite; si no, diferido.

### 3.3 Correo transaccional
- SMTP de Supabase Auth para correos de cuenta.
- Opcionalmente Resend para notificaciones transaccionales. Si no se implementa, diferido.

### 3.4 No funcionales
- Auditoría Lighthouse (accesibilidad ≥90, LCP).
- Prueba responsiva a 360 px.
- Script de carga con k6 o autocannon para RNF-01/RNF-09.
- Resultados en `docs/entregables/E3-pruebas-no-funcionales.md`.

**Criterio de salida:** CI verde. Admin puede gestionar usuarios y reseñas. Métricas con datos reales y CSV.

---

## Fase 4 — Despliegue a producción

### 4.1 Supabase Cloud
- `supabase link` y `supabase db push`.
- Cargar seed de demo y crear buckets.

### 4.2 Vercel
- Proyecto para `frontend/` y otro para `backend/`.
- Variables de entorno según `docs/guias/despliegue.md`.

### 4.3 Smoke test
- Flujo completo con 3 roles: registro → verificación → búsqueda → solicitud → cotización → aceptación → chat → completar → reseña → métricas.
- Automatizar como E2E de Playwright con `E2E_BASE_URL`.

### 4.4 Respaldo y README
- `supabase db dump` antes de la demo final.
- README actualizado: URL de producción, credenciales demo, estado, diagrama.

---

## Priorización ante falta de tiempo

Si no cabe todo antes del 09/11, priorizar por:

1. **Alta (A):** Fase 0 completa + Fase 1 completa (flujo core).
2. **Media (M):** Fase 2 (notificaciones + IA) + Fase 3 (admin + métricas).
3. **Baja (B):** Adjuntos en chat, búsqueda semántica, Google OAuth, correo transaccional externo.

Lo que se difiera se marca en `E3-estado-implementacion.md` con justificación.
