# E3 — Pruebas no funcionales

**Proyecto:** HVAC Connect (IIC3113, Grupo 1)
**Responsable:** José Villalobos (Supervisor Legal / Requerimientos)
**Fecha de ejecución:** 15/11/2026
**Rama:** `feature/pruebas-e3` (sale de `develop` en `e73f831`)

Este documento cierra la sección 3.4 de [`E3-plan-implementacion.md`](E3-plan-implementacion.md) y
alimenta la tabla §2 de [`E3-estado-implementacion.md`](E3-estado-implementacion.md). Las evidencias
(capturas e informes) están en [`evidencia/rnf/`](evidencia/rnf/).

## Resumen

| RNF    | Requisito                                              | Método                                                                                         | Resultado                                                                                 | Estado                            |
| ------ | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------- |
| RNF-01 | Búsqueda ≤ 2 s (p95)                                   | Script `tests/real/rnf-01-busqueda.cjs`, 50 búsquedas contra Supabase local                    | p95 = **41 ms** (p50 = 18 ms, máx. 56 ms), 0 errores                                      | ✅ OK                             |
| RNF-04 | HTTPS, RLS, sin secretos en el cliente, validación zod | Evidencia existente: pgTAP por rol y tests 401/403                                             | 79/79 pgTAP y `access-control.test.ts` en verde; HTTPS depende del despliegue             | 🟡 Parcial                        |
| RNF-05 | Consentimiento, privacidad y eliminación de datos      | Tests existentes + revisión de `/privacidad`                                                   | Consentimiento obligatorio y política publicados; **sin eliminación de cuenta en la app** | 🟡 Parcial (eliminación diferida) |
| RNF-06 | Responsiva desde 360 px                                | Playwright `tests/e2e/rnf-06-responsive.spec.ts`, viewport 360×740, 12 pantallas               | 12/12 sin scroll horizontal tras corregir D-38                                            | ✅ OK                             |
| RNF-07 | Lighthouse accesibilidad ≥ 90                          | Lighthouse 12.6 (móvil) sobre el build de producción, 4 páginas                                | Accesibilidad **92–94**                                                                   | ✅ OK                             |
| RNF-10 | TypeScript strict y CI verde                           | `pnpm typecheck && pnpm lint && pnpm test && pnpm build`                                       | Todo en verde (736 tests unitarios)                                                       | ✅ OK                             |
| RNF-11 | Español de Chile, CLP, dd-mm-aaaa, America/Santiago    | Tests unitarios en `shared/src/utils/format.test.ts` ejecutados con `TZ=UTC` y `TZ=Asia/Tokyo` | 18/18 tras corregir D-39                                                                  | ✅ OK                             |

## Entorno

- WSL2 (Linux 6.18), Node 24, Docker 29, Supabase CLI local con las migraciones 0001–0014 y el seed
  (36 proveedores, 5 cuentas demo).
- Backend `next dev` en `:3101` con `DEMO_MODE=false` (Supabase real local); frontend como build de
  producción (`vite build` + `vite preview`) en `:5273` para Lighthouse.
- Las pruebas E2E (RNF-06) corren en modo demo, igual que en CI.

---

## RNF-01 — Tiempo de respuesta de la búsqueda

**Criterio:** el p95 de `GET /api/providers/search` es de 2 s o menos.

**Método:** `API_URL=http://localhost:3101 N=50 node tests/real/rnf-01-busqueda.cjs`. Rota seis
combinaciones de BUS-01 a BUS-03: Santiago, Providencia con radio de 5 km, Las Condes con calificación
≥ 4,5 ordenada por calificación, Ñuñoa solo disponibles, Maipú con radio de 25 km y texto libre en la
página 2. Antes de medir hace una llamada de calentamiento, porque `next dev` compila la ruta en la
primera petición.

**Resultado (15/11/2026):**

```json
{
  "solicitudes": 50,
  "errores": 0,
  "resultadosTotales": 335,
  "minMs": 11,
  "p50Ms": 18,
  "p95Ms": 41,
  "maxMs": 56,
  "limiteMs": 2000,
  "resultado": "OK"
}
```

**Limitación:** la medición es local, sin la latencia de red hasta Vercel ni Supabase Cloud. Hay
margen de sobra (unas 50 veces menos que el límite), pero conviene repetirla contra producción con
`API_URL=<url del backend>`.

## RNF-04 — Seguridad (evidencia existente)

- RLS por rol: `pnpm db:test` da **79/79 OK** (7 archivos en `supabase/tests/`, incluidos
  `provider_metrics_test.sql` y el motivo de cancelación en `requests_test.sql`, que no se habían
  ejecutado nunca).
- Control de acceso: `backend/src/app/api/access-control.test.ts` (401/403 por endpoint) y
  `frontend/src/panel-routes.test.tsx` (`RequireRole`).
- Validación: todos los endpoints validan con zod (`parseQuery` y `parseBody`).
- **Pendiente:** verificar HTTPS y encabezados en el despliegue de producción.

## RNF-05 — Consentimiento, privacidad y eliminación

| Aspecto                                     | Estado          | Evidencia                                                                                                                                                                                                                                                                         |
| ------------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consentimiento obligatorio en el registro   | ✅              | `shared/src/schemas/auth.ts` (`acceptTerms: z.literal(true)`), `auth-form.test.tsx`, `profiles.accepted_terms_at` (migración 0007), pgTAP `auth_test.sql`                                                                                                                         |
| Política de privacidad pública (Ley 19.628) | ✅              | `/privacidad` (`frontend/src/pages/legal/PrivacyPage.tsx`): datos recolectados, finalidad, con quién se comparten, derechos, conservación y seguridad. Captura `evidencia/rnf/rnf-06-privacidad.png`                                                                              |
| Términos y condiciones                      | ✅              | `/terminos`                                                                                                                                                                                                                                                                       |
| Minimización de datos (RN-10)               | ✅              | El proveedor ve solo comuna y distancia antes de la adjudicación (`provider_inbox`); el contacto solo es visible con cotización aceptada                                                                                                                                          |
| **Eliminación de cuenta y datos**           | ❌ **Diferido** | La app no tiene un flujo de baja. Mientras tanto, el titular ejerce su derecho de cancelación según lo indicado en `/privacidad` y el administrador elimina el usuario desde Supabase Auth (el borrado se propaga en cascada a `profiles`). Se registra en la Solicitud de Cambio |

## RNF-06 — Interfaz responsiva desde 360 px

**Criterio:** ninguna pantalla clave genera scroll horizontal a 360 px de ancho.

**Método:** `pnpm test:e2e tests/e2e/rnf-06-responsive.spec.ts --project=chromium`. Para cada
pantalla compara `scrollWidth` con `clientWidth` y, si hay desborde, lista los elementos que se salen
del ancho. Se probaron: inicio, buscar, mapa, perfil de proveedor, registro, ingresar, privacidad,
panel del cliente, nueva solicitud, panel del proveedor, bandeja del proveedor y verificaciones del
admin.

**Resultado:**

- 1.ª ejecución: **11/12**. `/panel/solicitudes` desbordaba 17 px porque los botones "Buscar
  proveedores" y "Nueva solicitud" (`whitespace-nowrap`) quedaban en una sola fila → **D-38**.
- Tras corregir (botones apilados en móvil, en fila desde `sm`): **12/12 OK**.

Capturas: `evidencia/rnf/rnf-06-*.png`.

## RNF-07 — Lighthouse

**Criterio:** accesibilidad ≥ 90.

**Método:** Lighthouse 12.6.0, perfil móvil por defecto (CPU ×4 y red 4G lenta simuladas), sobre el
build de producción servido con `vite preview` y conectado al backend real.

| Página           | Accesibilidad | Rendimiento | Buenas prácticas | SEO | LCP   | CLS   |
| ---------------- | ------------- | ----------- | ---------------- | --- | ----- | ----- |
| `/` (inicio)     | **92**        | 61          | 100              | 100 | 5,1 s | 0,012 |
| `/buscar`        | **94**        | 69          | 100              | 100 | 4,2 s | 0     |
| `/registro`      | **94**        | 72          | 100              | 100 | 4,2 s | 0,005 |
| `/proveedor/:id` | **93**        | 55          | 96               | 100 | 6,3 s | 0     |

Informes: `evidencia/rnf/rnf-07-*.report.html` (se abren en el navegador).

**Observaciones (no bloquean el RNF):**

- **Accesibilidad:** las auditorías que restan puntos son `color-contrast` (en las 4 páginas),
  `heading-order` (buscar y registro), `aria-prohibited-attr` (inicio) y `link-in-text-block`
  (perfil). Son mejoras de bajo esfuerzo para subir a ≥ 95.
- **Rendimiento:** el LCP de 4–6 s con la red simulada de móvil se debe al bundle principal (Vite
  advierte de chunks grandes, por MapLibre). El plan de E3 no fija un umbral de rendimiento; para
  mejorarlo se recomienda cargar el mapa de forma diferida con `import()` dinámico.

## RNF-11 — Localización (es-CL)

**Criterio:** textos en español de Chile, montos en CLP sin decimales, fechas dd-mm-aaaa y hora de
`America/Santiago`.

**Hallazgo D-39:** `formatDate` usaba la zona horaria del navegador. Un usuario con el equipo en otra
zona veía otra fecha cerca de la medianoche: por ejemplo, las 23:00 del 30/09 en Chile aparecían como
01-10. El chat y la bandeja del proveedor formateaban las fechas por su cuenta (`toLocaleString`), con
el mismo problema.

**Corrección:** `APP_TIME_ZONE = "America/Santiago"` en `shared/src/utils/format.ts`, más
`formatDate` y un nuevo `formatDateTime` (dd-mm-aaaa hh:mm, 24 h), que ahora usan el chat
(`request-chat.tsx`) y la bandeja (`ProviderInboxPage.tsx`).

**Prueba:** `shared/src/utils/format.test.ts`, bloque "RNF-11", con horario de verano (UTC-3) e
invierno (UTC-4), `formatDateTime` y CLP con punto de miles. Ejecutado con `TZ=UTC` y
`TZ=Asia/Tokyo`: **18/18 OK** en ambos.

**Revisión visual:** en las capturas de RNF-06 los textos están en español y los montos en `$`
con punto de miles.

---

## Cómo repetir

```bash
pnpm db:start && pnpm db:reset && pnpm db:test                     # RNF-04 (pgTAP)
# backend real en :3101 (ver tests/real/README.md)
API_URL=http://localhost:3101 node tests/real/rnf-01-busqueda.cjs  # RNF-01
pnpm test:e2e tests/e2e/rnf-06-responsive.spec.ts                  # RNF-06
npx lighthouse@12.6.0 http://localhost:5273/ --only-categories=accessibility,performance \
  --output=html --output-path=docs/entregables/evidencia/rnf/rnf-07-inicio  # RNF-07
TZ=UTC pnpm --filter @hvac/shared test                             # RNF-11
```
