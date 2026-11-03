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

---

## Bloque B — Sprint 1: cuentas (REQ-AUT)

**Fecha:** 02/11/2026 · **Rama:** `feature/bloque-b`

### Lo hecho
- **AUT-01:** checkbox obligatorio de términos y privacidad; páginas `/terminos` y `/privacidad` (Ley 19.628); `accepted_terms_at` en `profiles`; solo cliente o proveedor en el registro, validado también en `handle_new_user` (RN-01).
- **AUT-02:** `POST /api/auth/login` con mensaje genérico y bloqueo de 5 fallos en 15 minutos (`login_attempts`, regla compartida en `shared/utils/lockout.ts`, también en modo demo).
- **AUT-03:** `/recuperar` y `/restablecer` con la misma política de contraseña (8+ caracteres, letra y número).
- **AUT-04:** `RequireRole` en todas las rutas `/panel/*`, tests 401/403 por endpoint y rol leído desde `profiles`.
- **AUT-05:** logout que revoca la sesión; expiración por 7 días sin actividad (`config.toml` + chequeo en el cliente).
- **AUT-06:** botón de Google detrás de `VITE_GOOGLE_AUTH_ENABLED`, elección de rol en `/elegir-rol` con la RPC `choose_role`; pasos en `despliegue.md`.
- Verificación contra Supabase local (`DEMO_MODE=false`): 11/11 pasos OK, incluido el correo de recuperación real (Mailpit). 10 pruebas pgTAP nuevas.

### Problemas encontrados
- **D-14 (crítico):** la política `profiles_update_own` dejaba a cualquier usuario cambiar su propio `role` a admin por REST.
- **D-15/D-16:** el CI llevaba tiempo en rojo (Node 20 con jsdom; E2E sin modo demo ni puerto correcto).
- **D-17:** crear solicitudes y aceptar cotizaciones no exigía rol.

### Cómo se resolvieron
- D-14: permisos por columna (`grant update (full_name, phone)`) y rol leído siempre desde `profiles`.
- D-15/D-16: Node 22 en CI; Playwright con puertos por línea de comandos y modo demo explícito. CI verde en las ramas del Paso 0 y del Bloque A.
- D-17: `requireRole(["cliente"])` en ambas rutas.

### Lo que sigue
- Probar Google OAuth con credenciales reales cuando el equipo las cree.
- Plantillas de correo en español (NOT-02, Bloque F).
- Bloque C: perfil y verificación del proveedor; corregir D-12.

---

## Bloque C — Sprint 1: perfil y verificación del proveedor (REQ-PRO, REQ-VER)

**Fecha:** 02/11/2026 · **Rama:** `feature/bloque-c`

### Lo hecho
- Observaciones del cliente al probar el panel: el proveedor ahora edita su perfil y **carga sus servicios desde su cuenta**; "Editar perfil" lleva a `/panel/proveedor/perfil`; "Para proveedores" ya no aparece en el navbar con sesión; la verificación se mantiene simple.
- **PRO-01/02/03/06:** formulario de perfil (empresa, contacto, servicios del catálogo con precio desde, comuna base y radio 1–100 km, disponibilidad y horario semanal) y `GET/PUT /api/providers/me`.
- **VER-01/02/03:** el wizard envía la solicitud (`en_revision` + `verification_items`); el admin aprueba o rechaza con motivo obligatorio; `audit_log` y notificación al proveedor; el dashboard muestra el estado real y el motivo de rechazo.
- **PRO-05 / RN-10:** el detalle público oculta teléfono y correo salvo al admin, al propio proveedor y al cliente con cotización aceptada.
- Migración `0008`: búsqueda solo de verificados, acotada al radio de cobertura, con texto, paginación y coordenadas.
- Verificación contra Supabase local: 13/13 pasos OK (registro → perfil → verificación → aprobación → notificación → búsqueda → contacto oculto). 6 pruebas pgTAP de búsqueda.

### Problemas encontrados
- **D-18 (crítico):** con Supabase real la búsqueda no funcionaba (parámetros inexistentes en la RPC, sin coordenadas ni servicios).
- **D-19 (crítico):** con Supabase real no se puede cotizar (`provider_id` recibía el id del usuario).
- **D-20/D-21:** inconsistencias del panel reportadas por el cliente.

### Cómo se resolvieron
- D-18: `nearby_providers` reescrita y mapper corregido.
- D-20/D-21: corregidos en este bloque.
- D-19 queda para el Bloque E (cotizaciones).

### Diferido
- **PRO-04 (Storage de documentos y galería):** por decisión del cliente la verificación no requiere subir archivos por ahora. Va a la Solicitud de Cambio.
- Vista previa del radio de cobertura sobre el mapa (hoy se indica en texto).

### Lo que sigue
- Bloque D (búsqueda): selector región → comuna, radio por defecto 10 km, filtros por calificación y disponibilidad, paginación en la UI.

---

## Bloque E — Sprint 2: solicitudes y cotizaciones (REQ-SOL, REQ-COT)

**Fecha:** 02/11/2026 · **Rama:** `feature/bloque-e` (adelantado antes del Bloque D porque D-19 impedía cotizar con Supabase real)

### Lo hecho
- Migración `0009`: elegibilidad RN-03, ubicación por comuna, bandeja limitada del proveedor, RPC transaccionales con actor (`create_quote`, `accept_quote`, `reject_quote`, `transition_request`, `confirm_completion`), vencimiento de cotizaciones, índice único parcial (RN-04) y RLS sin cambios directos de estado.
- Backend: servicio de solicitudes reescrito con las mismas reglas en Supabase y en modo demo; notificaciones a elegibles, al cliente y a todos los proveedores involucrados.
- Frontend: formulario con servicio y ubicación, tabla comparativa de cotizaciones, aceptar/rechazar, cancelar con motivo, confirmar trabajo, bandeja en tres grupos con filtros y filtro por estado en el historial del cliente.
- Verificación: 12/12 pasos del ciclo completo contra Supabase local; 18 pruebas pgTAP de reglas y RLS; 12 pruebas unitarias del flujo; 1 E2E del ciclo en modo demo.

### Problemas encontrados
- **D-22/D-23 (críticos):** las RPC no validaban al actor desde el backend y la RLS permitía cambiar estados por REST.
- **D-24:** recursión infinita entre políticas RLS (la detectó pgTAP).
- **D-25:** el proveedor adjudicado no veía la dirección (lo detectó el E2E real).
- **D-26:** incoherencia del seed con RN-03.

### Cómo se resolvieron
- RPC con actor explícito solo para `service_role`; RLS de solo lectura; función `is_awarded_provider`; fila completa al adjudicado; seed corregido.

### Diferido
- **Fotos de la solicitud (SOL-01, bucket `request-photos`):** mismo criterio que PRO-04 (Storage fuera del alcance acordado por ahora).
- Auto-confirmación con `pg_cron`: se evalúa de forma perezosa al leer (decisión documentada; funciona igual en local y en el plan gratuito).

### Lo que sigue
- Bloque D (búsqueda): selector región → comuna, radio por defecto 10 km, filtros por calificación y disponibilidad, paginación en la UI.

---

## Bloque D — Sprint 1: búsqueda (REQ-BUS)

**Fecha:** 02/11/2026 · **Rama:** `feature/bloque-d`

### Lo hecho
- **Caso reportado por el cliente:** su empresa nueva no aparecía en `/buscar`. Causa: estaba "pendiente" (sin verificación enviada ni aprobada) y en Lo Barnechea, fuera del radio buscado desde el centro de Santiago. Ahora el panel del proveedor explica qué le falta para aparecer y la búsqueda permite elegir la comuna.
- **BUS-01:** selector región → comuna cuando no hay geolocalización.
- **BUS-02:** radio por defecto de 10 km; respeta la cobertura del proveedor.
- **BUS-03:** filtros por servicio, calificación mínima y disponibilidad; orden en el servidor; páginas de 10 (migración `0010`).
- **BUS-04:** teselas raster de OpenStreetMap por defecto (MapTiler si hay clave).
- Verificación contra Supabase local: búsqueda por comuna, paginación (16 → 2 páginas), calificación ≥ 4,5 ordenada, disponibilidad, servicio y teselas OSM. 3 pruebas pgTAP nuevas; E2E del caso de visibilidad.

### Problemas encontrados
- **D-28:** en modo demo el admin no podía aprobar a nadie (el esquema exigía UUID) y la tabla ocultaba el error.
- **D-29:** Hogar Fresco duplicado en modo demo. **D-30:** el hook no enviaba servicio ni página. **D-31:** fuentes del mapa con 404.

### Cómo se resolvieron
- Ver la tabla de defectos (D-27 a D-31).

### Lo que sigue
- Bloque F: mensajería en tiempo real (Realtime) y notificaciones en vivo + correos.

---

## Bloque F — Sprint 2: mensajería y notificaciones (REQ-MSG, REQ-NOT)

**Fecha:** 03/11/2026 · **Rama:** `feature/bloque-f`

### Lo hecho
- **MSG-01:** migración `0011` (hilo por solicitud y proveedor desde la primera cotización, RLS de participantes, Realtime); API de hilos y mensajes; chat en el detalle de la solicitud con pestañas por proveedor, no leídos y "Leído".
- **NOT-01:** campana en vivo con Supabase Realtime (polling corto en modo demo) y notificación de mensaje nuevo.
- **NOT-02:** plantillas de correo de cuenta en español; correos de cotización recibida, cotización aceptada y verificación por Resend, con degradación a log sin `RESEND_API_KEY`.
- Verificación contra Supabase local con dos navegadores: entrega en vivo de 352 ms (proveedor → cliente) y 1.061 ms (cliente → proveedor); la campana sube sin recargar; otro proveedor no ve la conversación; correo de recuperación en español en Mailpit.

### Problemas encontrados
- **D-32:** carrera al enviar el primer mensaje (detectada por el E2E). **D-33:** timeouts de tests en equipos cargados.
- El `node_modules` del worktree temporal se dañó al limpiarse `%TEMP%`; se reinstaló (solo afecta el entorno de pruebas).

### Diferido
- **MSG-02 (adjuntos en el chat):** sin Storage por ahora, mismo criterio que PRO-04.

### Lo que sigue
- Bloque G: diagnóstico con IA estructurado, búsqueda semántica y límite de uso (IA-01, IA-02, IA-04).

---

## Cierre de sesión — 03/11/2026

- Bloques Paso 0, A, B, C, D, E y F integrados en `develop` (CI verde en cada rama).
- Traspaso documentado en [`AGENTS.md`](../../AGENTS.md): estado, pendientes (Bloque G de IA y Bloque H de pruebas), decisiones de diseño y problemas conocidos del entorno.
- Scripts de verificación contra Supabase real movidos a [`tests/real/`](../../tests/real/README.md).
- Supabase local detenido (sin contenedores Docker activos).

