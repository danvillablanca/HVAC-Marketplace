# E3 — Bitácora de Implementación

**Proyecto:** HVAC Connect (IIC3113, Grupo 1)

---

## Fase 0 — Seguridad y base para producción

**Fecha inicio:** 01/11/2026
**Fecha fin:** —

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
