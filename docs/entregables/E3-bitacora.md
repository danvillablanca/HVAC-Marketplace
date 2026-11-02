# E3 — Bitácora de Implementación

**Proyecto:** HVAC Connect (IIC3113, Grupo 1)

---

## Fase 0 — Seguridad y base para producción

**Fecha inicio:** 01/11/2026
**Fecha fin:** 02/11/2026

### Lo hecho
- Diagnóstico completo del repositorio: 14 tablas, 527 tests, 12 endpoints sin autenticación.
- Creado plan de implementación (`E3-plan-implementacion.md`).
- Creado ADR-0008 (justificación del stack vs. E2).
- Inicializado documento de trazabilidad (`E3-estado-implementacion.md`).

### Problemas encontrados
- **Crítico:** Ningún endpoint del backend valida JWT ni rol. Cualquier cliente puede acceder a leads, appointments, admin verifications y reviews.
- **Alto:** El modo demo se activa silenciosamente cuando no hay Supabase configurado, sin variable de control.
- **Medio:** El seed tiene solo 10 proveedores, insuficiente para una demo convincente.

### Cómo se resolvieron
- Se diseñó middleware `requireUser`/`requireRole` para el backend.
- Se definió la estrategia `DEMO_MODE` con variable de entorno.
- Se planificó la expansión del seed a ≥30 proveedores.

### Lo que sigue
- Implementar el middleware de auth y aplicarlo a todos los endpoints.
- Rebranding a "HVAC Connect".
- MapLibre con fallback OSM.
- Seed ampliado + credenciales demo.
- Crear `vercel.json`.

---

### Cierre (02/11/2026)
- Se commiteó el trabajo pendiente en 10 commits por tema (rama `feature/fase0-docs-y-seguridad`).
- Se corrigieron `npm run dev` en Windows (D-04), el "NetworkError" al registrarse (D-06), la bandeja vacía del proveedor en modo demo (D-07) y el lint en Windows (D-08).
- Recorrido Playwright de `flujos-funcionales.md` en modo demo: 37/37 pasos OK.

---

## Bloque A — Datos base y ambiente de prueba (1.4.1.2.2 y 1.5.1.1)

**Fecha:** 02/11/2026 · **Rama:** `feature/bloque-a`

### Lo hecho
- Migración `0006_communes.sql`: tabla `communes` con 52 comunas de la RM y las 16 capitales regionales (+ Viña del Mar), con centroide `geography(Point)` y RLS de lectura pública.
- Seed ampliado: 36 proveedores (32 verificados, 2 no disponibles, 4 en cola de verificación), con radio de cobertura, horario semanal y experiencia; 7 solicitudes en los 6 estados con historial; 8 cotizaciones en los 4 estados; 55 reseñas; notificaciones de ejemplo.
- 5 usuarios demo en `auth.users` + `auth.identities` (login verificado contra Supabase Auth local).
- Pruebas pgTAP (`supabase/tests/seed_test.sql`, 11 pruebas) con `pnpm db:test`, y job `database` en CI.
- Guía `docs/guias/demo.md` con credenciales y contenido del seed.

### Problemas encontrados
- Supabase CLI v3 rechaza la sección `[inbucket]` de `config.toml` (D-13).
- Al revisar el esquema aparecieron D-10 (nombre no se guarda en `profiles`), D-11 (`transition_request` sin control de actor) y D-12 (`nearby_providers` muestra no verificados con `is_demo`).

### Cómo se resolvieron
- D-13: sección renombrada a `[local_smtp]`.
- D-10, D-11 y D-12 quedan registrados para los bloques B, E y C.
- El rol admin del seed se asigna con `update` en `profiles`, para no depender de que el registro acepte `role = admin` (D-05).

### Lo que sigue
- Bloque B (cuentas): corregir D-05 y D-10, consentimiento, bloqueo por intentos, recuperación de contraseña, expiración de sesión y OAuth.

