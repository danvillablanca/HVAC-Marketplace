# ADR-0001: Monorepo con pnpm y Turborepo

- **Estado:** Aceptada
- **Fecha:** 2026-09
- **Decisores:** Equipo Grupo 1 (IIC3113)

## Contexto

Marketplace HVAC se compone de al menos tres piezas que evolucionan juntas: una SPA de frontend,
una API de backend y un paquete de código compartido (tipos y esquemas de validación). El proyecto
es desarrollado por un equipo pequeño en un semestre académico, con necesidad de:

- Compartir tipos y contratos entre frontend y backend sin duplicarlos.
- Ejecutar tareas de verificación (typecheck, lint, build) de forma consistente en CI.
- Mantener una sola fuente de verdad para dependencias y versiones de Node/pnpm.

## Decisión

Adoptar un **monorepo** gestionado con **pnpm workspaces** y orquestado con **Turborepo**.

- Workspaces definidos en `pnpm-workspace.yaml`: `frontend`, `backend`, `shared`.
- El paquete compartido se consume como `@hvac/shared` (`workspace:*`).
- Turborepo (`turbo.json`) define las tareas `dev`, `build`, `lint` y `typecheck`, con caché y
  grafo de dependencias (`dependsOn: ["^build"]`).
- Node `>= 20` y `pnpm@12.4.2` fijados en `package.json` (`engines`, `packageManager`).

## Alternativas consideradas

| Alternativa                       | Por qué no                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------- |
| Repositorios separados (polyrepo) | Duplicación de tipos; versionado coordinado complejo para un equipo pequeño.                |
| npm/yarn workspaces               | pnpm es más eficiente en disco/enlaces y es el estándar del ecosistema actual.              |
| Nx                                | Potente pero con mayor curva de aprendizaje y configuración; sobredimensionado para el MVP. |
| Lerna                             | Orientado a publicación de paquetes; Turborepo cubre mejor caché de tareas.                 |

## Consecuencias

### Positivas

- Un solo `pnpm install` instala todo el monorepo.
- Tipos y validaciones compartidos garantizan contratos coherentes entre capas.
- CI unificado y caché de Turborepo aceleran las verificaciones.
- Versionado y configuración centralizados.

### Negativas

- Despliegue en Vercel requiere configurar **un proyecto por app** con `Root Directory` distinto.
- Mayor complejidad inicial de configuración (workspaces, aliases, tsconfig base).
- Turborepo añade una capa de indirección que el equipo debe conocer.
