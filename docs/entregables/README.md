# Entregables del curso

Índice que mapea los entregables del curso **IIC3113** con los artefactos de este repositorio.
Cada entregable vive (o vivirá) en su carpeta y se apoya en el código y la documentación técnica
del proyecto.

- **Proyecto:** Marketplace HVAC
- **Cliente:** ASHRAE Chile
- **Equipo:** Grupo 1
- **Integrantes:** equipo de desarrollo (detalle en el Acta de Equipo de E1).

## Hitos

| Hito | Fecha     | Entregable                        | Foco                                                                    |
| ---- | --------- | --------------------------------- | ----------------------------------------------------------------------- |
| H1   | **01/10** | **E1** — Inicio y planificación   | Caso de negocio, constitución, interesados, equipo, avance, video.      |
| H2   | **01/11** | **E2** — Alcance y plan detallado | Requerimientos, EDT, cronograma, riesgos, presupuesto, plan de pruebas. |
| H3   | **24/11** | **E3** — Cierre y evaluación      | Métricas, cambio, aceptación, cierre, lecciones, reporte final.         |

## E1 — Inicio y planificación

| Entregable              | Descripción                                                   | Soporte en el repositorio                                            |
| ----------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------- |
| Caso de Negocio         | Justificación, mercado y propuesta de valor HVAC en Chile.    | `docs/diseno/` (visión y alcance), README (descripción y cliente).   |
| Acta de Constitución    | Objetivos, alcance, supuestos y restricciones.                | `docs/diseno/`; alcance del MVP en README.                           |
| Registro de Interesados | Cliente ASHRAE, usuarios cliente/proveedor, equipo, docentes. | `shared/src/types/index.ts` (roles `cliente`, `proveedor`, `admin`). |
| Acta de Equipo          | Integrantes, roles y responsabilidades.                       | `docs/guias/contribucion.md` (flujo, ramas, revisión).               |
| Reporte de Avance       | Estado del andamiaje inicial.                                 | Rama `draft/ai-scaffold`; estado del proyecto en README.             |
| Video                   | Demo del avance.                                              | Flujo demo con datos semilla (`pnpm db:reset`) y fallback demo.      |

## E2 — Alcance y plan detallado

| Entregable          | Descripción                         | Soporte en el repositorio                                                                   |
| ------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------- |
| Requerimientos      | Funcionales y no funcionales.       | Endpoints (`backend`), rutas (`frontend/src/App.tsx`), esquemas zod (`shared/src/schemas`). |
| EDT (WBS)           | Desglose del trabajo.               | Estructura del monorepo y estado del proyecto (README).                                     |
| Cronograma          | Hitos 01/10, 01/11, 24/11 y tareas. | Esta tabla de hitos; milestones del repositorio.                                            |
| Registro de Riesgos | Riesgos y mitigaciones.             | R5 (cuotas gratuitas) documentado en `docs/guias/despliegue.md`.                            |
| Presupuesto         | Costos y herramientas.              | Stack sobre capas gratuitas (Vercel, Supabase, MapTiler, GitHub Actions).                   |
| Plan de Prueba      | Estrategia de verificación.         | CI `.github/workflows/ci.yml` (`typecheck`, `lint`, `build`); validación con zod.           |

## E3 — Cierre y evaluación

| Entregable                  | Descripción                                 | Soporte en el repositorio                                               |
| --------------------------- | ------------------------------------------- | ----------------------------------------------------------------------- |
| Métricas                    | KPIs del producto y del proyecto.           | Pendiente de medición; datos base en `docs/diseno/`.                    |
| Solicitud de Cambio         | Cambios de alcance (p. ej. diferir IA/RAG). | [ADR-0006](../adr/0006-diferir-modulo-ia-rag.md) documenta la decisión. |
| Certificación de Aceptación | Conformidad del cliente (ASHRAE).           | Checklist pre-demo en `docs/guias/despliegue.md`.                       |
| Acta de Cierre              | Cierre formal del proyecto.                 | Estado final del proyecto (README) y este índice.                       |
| Lecciones Aprendidas        | Retrospectiva.                              | Historial de ADR y commits convencionales (`docs/adr/`).                |
| Reporte Final               | Síntesis de resultados.                     | Índice de documentación técnica en README (`docs/`).                    |

## Trazabilidad a `docs/diseno/`

La documentación de **diseño** (visión, alcance, casos de uso, modelo de datos, wireframes) es la
fuente de la que derivan los entregables y las decisiones técnicas. Este repositorio la enlaza
desde:

- `docs/adr/` — decisiones de arquitectura que materializan el diseño
  (monorepo, API, SPA, mapa, Supabase, IA diferida, arte).
- `docs/guias/` — guías operativas (setup, despliegue, contribución).
- `docs/entregables/` — este índice.

> Mantén `docs/diseno/` como fuente de verdad del "qué" y `docs/adr/` como registro del "por qué"
> de las decisiones técnicas. Cada entregable de E1/E2/E3 debería poder rastrearse hasta el diseño
> y hasta una implementación concreta en el monorepo.
