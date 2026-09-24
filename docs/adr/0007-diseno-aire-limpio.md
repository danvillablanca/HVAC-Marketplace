# ADR-0007: Dirección de arte "Aire Limpio"

- **Estado:** Aceptada
- **Fecha:** 2026-09
- **Decisores:** Equipo Grupo 1 (IIC3113)

## Contexto

El producto debe transmitir **confianza, limpieza y aire puro**, coherente con el rubro HVAC
(climatización, ventilación) y con el respaldo de estándares ASHRAE. El cliente (ASHRAE Chile) usa
un cian característico en su identidad. Se necesita un sistema visual consistente que el equipo
pueda aplicar rápido en React + Tailwind v4, con soporte de modo claro/oscuro.

## Decisión

Adoptar la dirección de arte **"Aire Limpio"**, un sistema de diseño basado en tokens CSS y
Tailwind v4, definido en `frontend/src/index.css`.

Principios:

- **Paleta**: base del cian de ASHRAE/Hawaii Chile (`#6ACBEE`) modernizado, con un primario más
  profundo (`#0EA5C9`) para acciones y contraste accesible.
- **Modo claro por defecto**, con modo oscuro opcional (`.dark`).
- **Tipografía**: `Sora` para títulos (display) e `Inter` para el cuerpo.
- **Formas**: radio base `0.75rem`, tarjetas blancas sobre fondo gris-azulado claro.
- **Tokens semánticos**: `background`, `foreground`, `card`, `primary`, `secondary`, `muted`,
  `accent`, `destructive`, `success`, `warning`, `border`, `input`, `ring`.
- **Utilidades**: `.container-page`, `.text-gradient`.

Tokens principales (modo claro):

| Token                                       | Valor                             | Uso                      |
| ------------------------------------------- | --------------------------------- | ------------------------ |
| `--background`                              | `#F5F9FB`                         | Fondo general.           |
| `--foreground`                              | `#12212B`                         | Texto principal.         |
| `--primary`                                 | `#0EA5C9`                         | Acciones, enlaces, foco. |
| `--accent`                                  | `#6ACBEE`                         | Acentos, gradientes.     |
| `--card`                                    | `#FFFFFF`                         | Superficies.             |
| `--muted-foreground`                        | `#5B6B76`                         | Texto secundario.        |
| `--success` / `--warning` / `--destructive` | `#16A34A` / `#D97706` / `#DC2626` | Estados.                 |

## Alternativas consideradas

| Alternativa                              | Por qué no                                                      |
| ---------------------------------------- | --------------------------------------------------------------- |
| **UI kit por defecto (shadcn neutro)**   | Genérico, sin identidad de marca.                               |
| **Paleta fría corporativa azul clásica** | Menos distintiva y menos ligada a ASHRAE.                       |
| **Verde "eco"**                          | Asociado a sostenibilidad, pero no al cian de marca ni al aire. |
| **Modo oscuro por defecto**              | Reduce el aire "limpio/luminoso" y complica demos en proyector. |

## Consecuencias

### Positivas

- Identidad visual coherente con el rubro y con el cliente.
- Tokens semánticos permiten cambiar tema sin tocar componentes.
- Soporte claro/oscuro y accesibilidad de foco (`--ring`) integrados.
- Alineado con Tailwind v4 vía `@theme inline`, sin configuración JS extra.

### Negativas

- El cian puede fallar contraste si se usa en texto pequeño; se debe preferir `--primary` y
  superficies sólidas.
- Requiere disciplina: evitar colores hardcodeados y usar tokens.
- El sistema debe mantenerse sincronizado entre modo claro y oscuro.

## Referencias

- Implementación: `frontend/src/index.css`.
- Componentes base: `frontend/src/components/ui/`.
- Utilidades: `frontend/src/lib/utils.ts` (`cn`).
