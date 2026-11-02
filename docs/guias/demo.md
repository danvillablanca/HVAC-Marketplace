# Datos y cuentas demo

Credenciales y datos de prueba de **HVAC Connect**. Sirven para entornos locales y de prueba;
nunca se cargan en producción.

## Dos modos de ejecución

| Modo | Variables | Usuarios y datos |
| --- | --- | --- |
| **Supabase local** (recomendado) | `DEMO_MODE=false` y claves reales de `npx supabase status` en `.env` | Seed de `supabase/seed.sql`, cargado con `pnpm db:reset` |
| **Demo sin base de datos** | `DEMO_MODE=true`, `VITE_DEMO_MODE=true`, sin claves de Supabase | Cuentas en `localStorage` y datos en memoria del backend (se borran al reiniciarlo) |

Para usar Supabase local, copia en `.env` los valores de `npx supabase status`:

```bash
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<ANON_KEY>
DEMO_MODE=false
VITE_DEMO_MODE=false
```

## Cuentas demo

Todas usan la contraseña **`demo1234`**. Existen en `auth.users` (seed) y también en el modo demo.

| Rol | Email | Nombre | Qué tiene precargado |
| --- | --- | --- | --- |
| Cliente | `cliente@demo.cl` | Camila Rojas | Solicitudes abierta, con cotizaciones (2 para comparar), en ejecución y cancelada. 2 notificaciones sin leer. |
| Cliente | `cliente2@demo.cl` | Matías Fuentes | Solicitudes aceptada, completada (con reseña) y con cotizaciones (una vencida). |
| Proveedor | `proveedor@demo.cl` | Hogar Fresco Instalaciones (La Florida) | Proveedor verificado. Cotizaciones enviada, aceptada (×2). |
| Proveedor | `proveedor2@demo.cl` | Climatiza Ñuñoa SpA (Ñuñoa) | Proveedor verificado. Cotizaciones enviada (×2), aceptada y rechazada. |
| Admin | `admin@demo.cl` | Admin ASHRAE | Cola de verificación con 4 proveedores (pendiente, en revisión y rechazado). |

El rol `admin` no se puede obtener al registrarse (RN-01): el seed lo asigna directamente en
`public.profiles`.

## Contenido del seed

- **Comunas** (`public.communes`, migración `0006`): 52 comunas de la Región Metropolitana y las
  capitales de las 16 regiones (más Viña del Mar), con centroide aproximado.
- **Proveedores:** 36 en total.
  - 32 verificados, repartidos en comunas de la RM y regiones, con distintos radios de cobertura
    (5–50 km), servicios, horario semanal y años de experiencia.
  - 2 de los verificados están marcados como no disponibles.
  - 4 en la cola de verificación: 2 pendientes, 1 en revisión y 1 rechazado.
- **Solicitudes:** 7, que cubren los 6 estados (`abierta`, `con_cotizaciones`, `aceptada`,
  `en_ejecucion`, `completada`, `cancelada`), con su historial en `service_request_events`.
- **Cotizaciones:** 8, en los 4 estados (`enviada`, `aceptada`, `rechazada`, `vencida`).
- **Reseñas:** 55, incluida una asociada a la solicitud completada.

## Verificar el seed

```bash
pnpm db:reset   # aplica migraciones + seed
pnpm db:test    # pruebas pgTAP de supabase/tests/
```
