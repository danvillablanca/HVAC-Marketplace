# ADR-0004: MapLibre GL con MapTiler en el mapa

- **Estado:** Aceptada
- **Fecha:** 2026-09
- **Decisores:** Equipo Grupo 1 (IIC3113)

## Contexto

La propuesta de valor del marketplace incluye **descubrimiento geoespacial**: mostrar en un mapa
los proveedores HVAC cercanos al usuario, filtrar por radio/segmento y calcular distancias. Se
necesita una librería de mapas web con buen rendimiento, personalización y bajo costo, con soporte
para geolocalización del navegador.

## Decisión

Usar **MapLibre GL JS** como motor de mapas y **MapTiler** como proveedor de tiles/estilos.

- Estilo: `https://api.maptiler.com/maps/streets-v2/style.json?key=${VITE_MAPTILER_KEY}`.
- **Fallback sin key**: estilo público `https://demotiles.maplibre.org/style.json`.
- Centro por defecto: Santiago, Chile (`DEFAULT_MAP_CENTER` en `@hvac/shared`).
- Distancias calculadas en cliente con **Haversine** (`frontend/src/lib/geo.ts`).
- La key `VITE_MAPTILER_KEY` es **opcional**; su ausencia no rompe el mapa (modo demo).

## Alternativas consideradas

| Alternativa                 | Por qué no                                                                       |
| --------------------------- | -------------------------------------------------------------------------------- |
| **Google Maps**             | Costos/licencias menos flexibles para un proyecto académico.                     |
| **Mapbox GL JS**            | Requiere token con cuota; licencia más restrictiva; MapLibre es su fork abierto. |
| **Leaflet**                 | Maduro y simple, pero con menor capacidad de estilos vectoriales avanzados.      |
| **Sin mapa (solo listado)** | Pierde la propuesta de valor de cercanía geográfica.                             |

## Consecuencias

### Positivas

- MapLibre es **open source** (licencia BSD), sin dependencia de vendor para el motor.
- Renderizado vectorial fluido y estilos personalizables alineados a "Aire Limpio".
- MapTiler ofrece una **capa gratuita (~100k tiles/mes)** suficiente para demos.
- Fallback a un estilo demo público garantiza que el mapa funcione incluso sin key.

### Negativas

- Dependencia de MapTiler para estilos/tiles en producción (posible proveedor intercambiable).
- Al ser un fork de Mapbox GL, parte del ecosistema/plugins puede estar menos mantenido.
- Consumo de cuota de tiles: debe cuidarse durante demos (riesgo R5, ver guía de despliegue).
- El fallback `demotiles` tiene baja calidad cartográfica; solo sirve para demostración.
