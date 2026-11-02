# E3 — Estado de Implementación y Trazabilidad

**Proyecto:** HVAC Connect (IIC3113, Grupo 1)
**Última actualización:** 01/11/2026

---

## 1. Tabla de requerimientos funcionales

| ID | Resumen | Prio | Estado | Evidencia | Caso PR | Resultado | Fecha |
|---|---|---|---|---|---|---|---|
| REQ-AUT-01 | Registro con nombre, email, contraseña y rol | A | Parcial | `auth-context.tsx` (demo), Supabase Auth | PR-001 | No ejecutada | — |
| REQ-AUT-02 | Login email/contraseña | A | Parcial | `auth-context.tsx` (demo), Supabase Auth | PR-002 | No ejecutada | — |
| REQ-AUT-03 | Recuperación de contraseña | M | Pendiente | — | PR-003 | No ejecutada | — |
| REQ-AUT-04 | Control de acceso por rol (rutas + RLS) | A | Parcial | RLS en `0003_rls.sql`; backend sin JWT | PR-004 | No ejecutada | — |
| REQ-AUT-05 | Logout y expiración de sesión | M | Parcial | Logout en `auth-context.tsx`; sin expiración | PR-005 | No ejecutada | — |
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
| REQ-BUS-03 | Filtros, orden, paginación | A | Parcial | Filtro por segmento y servicio; sin paginación | PR-018 | No ejecutada | — |
| REQ-BUS-04 | Resultados en mapa | B | Implementado | `MapView` con marcadores y clustering | PR-019 | No ejecutada | — |
| REQ-SOL-01 | Crear solicitud de servicio | A | Pendiente | — | PR-020 | No ejecutada | — |
| REQ-SOL-02 | Distribución a proveedores elegibles | A | Pendiente | — | PR-021 | No ejecutada | — |
| REQ-SOL-03 | Bandeja del proveedor | A | Pendiente | — | PR-022 | No ejecutada | — |
| REQ-SOL-04 | Estados de solicitud con historial | A | Pendiente | — | PR-023 | No ejecutada | — |
| REQ-SOL-05 | Cancelar solicitud e historial | M | Pendiente | — | PR-024 | No ejecutada | — |
| REQ-COT-01 | Cotización con monto CLP | A | Pendiente | — | PR-025 | No ejecutada | — |
| REQ-COT-02 | Comparar y aceptar cotizaciones | A | Pendiente | — | PR-026 | No ejecutada | — |
| REQ-COT-03 | Marcar ejecución y completar | A | Pendiente | — | PR-027 | No ejecutada | — |
| REQ-MSG-01 | Chat en tiempo real | M | Pendiente | — | PR-028 | No ejecutada | — |
| REQ-MSG-02 | Adjuntos de imagen | B | Pendiente | — | PR-029 | No ejecutada | — |
| REQ-NOT-01 | Campana con notificaciones | M | Pendiente | — | PR-030 | No ejecutada | — |
| REQ-NOT-02 | Correos transaccionales | M | Pendiente | — | PR-031 | No ejecutada | — |
| REQ-VAL-01 | Reseña 1–5 solo si Completada | A | Parcial | `reviews` en DB; sin restricción por estado | PR-032 | No ejecutada | — |
| REQ-VAL-02 | Promedio y conteo automáticos | A | Implementado | Trigger `increment_provider_reviews` | PR-033 | No ejecutada | — |
| REQ-VAL-03 | Respuesta del proveedor | B | Pendiente | — | PR-034 | No ejecutada | — |
| REQ-IA-01 | Diagnóstico asistido con IA | A | Pendiente | Stub en `services/ai.ts` | PR-035 | No ejecutada | — |
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
| RNF-04 | HTTPS, RLS, sin secretos en cliente, validación zod | Parcial | RLS ok, zod ok; backend sin JWT | No ejecutada |
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

| # | Descripción | Severidad | Estado | Fecha | Commit |
|---|---|---|---|---|---|
| 1 | Backend no valida JWT en ningún endpoint protegido | Crítica | En corrección | 01/11/2026 | — |
| 2 | Modo demo activo silenciosamente sin variable de control | Alta | En corrección | 01/11/2026 | — |
| 3 | Seed insuficiente (10 proveedores, sin usuarios de prueba en auth) | Media | En corrección | 01/11/2026 | — |

## 5. URL de producción y credenciales demo

| Recurso | URL |
|---|---|
| Frontend | *Pendiente de despliegue* |
| Backend API | *Pendiente de despliegue* |
| Supabase Dashboard | *Pendiente de configuración* |

**Credenciales demo:** ver `docs/guias/demo.md`.
