# Flujos funcionales testeables en local

Guía paso a paso de todos los flujos que puedes verificar en **HVAC Connect** corriendo localmente con modo demo.

## Requisitos previos

1. Tener el entorno levantado (ver [setup-local.md](./setup-local.md)).
2. En `.env`, asegurar que `DEMO_MODE=true` y `VITE_DEMO_MODE=true`.
3. Correr `pnpm dev` desde la raíz — frontend en `http://localhost:5173`, backend en `http://localhost:3001`.

## Cuentas demo

| Rol        | Email               | Contraseña | Panel por defecto              |
| ---------- | ------------------- | ---------- | ------------------------------ |
| Cliente    | `cliente@demo.cl`   | `demo1234` | `/panel/solicitudes`           |
| Proveedor  | `proveedor@demo.cl` | `demo1234` | `/panel/proveedor`             |
| Admin      | `admin@demo.cl`     | `demo1234` | `/panel/admin/verificaciones`  |

---

## Flujo 1 — Navegación pública (sin login)

**Ruta:** cualquier usuario no autenticado.

| Paso | Acción | Resultado esperado |
| ---- | ------ | ------------------ |
| 1 | Abrir `http://localhost:5173` | Landing con hero "Encuentra y contrata proveedores HVAC", CTA "Publicar requerimiento gratis" y "Ver proveedores cerca". |
| 2 | Click en "Publicar requerimiento gratis" | Navega a `/mapa` con el mapa interactivo de proveedores. |
| 3 | Navegar a `/buscar` | Lista de proveedores con filtros (segmento, servicio, comuna). |
| 4 | Click en una tarjeta de proveedor | Abre el modal del proveedor; "Ver perfil completo" navega a `/proveedor/:id`. Sin sesión (o sin cotización aceptada) el teléfono y el correo aparecen ocultos (RN-10). |
| 5 | Scroll a la sección FAQ en la landing | Sección interactuable: click en "¿Cómo verifican a los proveedores?" abre la respuesta. |
| 6 | Navegar a `/para-proveedores` | Página informativa para proveedores con CTA de registro. |
| 7 | Iniciar sesión con cualquier cuenta | El ítem "Para proveedores" desaparece del navbar. |

---

## Flujo 2 — Registro de usuario

**Ruta:** `/registro`

| Paso | Acción | Resultado esperado |
| ---- | ------ | ------------------ |
| 1 | Ir a `/registro` | Formulario con campos: nombre, email, contraseña, rol (cliente o proveedor). |
| 2 | Seleccionar rol "Proveedor" | Aparece campo adicional de RUT (formato `XX.XXX.XXX-X`). |
| 3 | Enviar sin marcar "Acepto los Términos y la Política de privacidad" | Muestra "Debes aceptar los terminos y la politica de privacidad". |
| 4 | Marcar el checkbox, completar (contraseña con 8+ caracteres, letras y números) y enviar | Registro exitoso, redirige al panel correspondiente al rol. |
| 5 | Intentar registrar con email ya existente | Muestra error. |

> El selector de rol solo ofrece cliente y proveedor: el admin no se auto-registra (RN-01).

---

## Flujo 3 — Login y logout

**Ruta:** `/ingresar`

| Paso | Acción | Resultado esperado |
| ---- | ------ | ------------------ |
| 1 | Ir a `/ingresar` | Formulario con email y contraseña. |
| 2 | Ingresar con `cliente@demo.cl` / `demo1234` | Login exitoso, redirige a `/panel/solicitudes`. Header cambia: aparece campana de notificaciones, "Mi panel", "Salir". |
| 3 | Click en "Salir" en el header | Cierra sesión, vuelve a mostrar "Ingresar" y "Crear cuenta". |
| 4 | Ingresar con `proveedor@demo.cl` / `demo1234` | Redirige a `/panel/proveedor`. |
| 5 | Ingresar con `admin@demo.cl` / `demo1234` | Redirige a `/panel/admin/verificaciones`. |
| 6 | Intentar login con credenciales inválidas | Muestra "Correo o contraseña incorrectos", no ingresa. |
| 7 | Fallar 5 veces con el mismo correo | El 6° intento (aunque la clave sea correcta) muestra "Demasiados intentos fallidos. Intenta de nuevo en N minutos". |
| 8 | Click en "¿Olvidaste tu contraseña?" e ingresar el correo | Mensaje de confirmación. Con Supabase local el correo llega a Mailpit (`http://127.0.0.1:54324`) y el enlace abre `/restablecer`. En modo demo indica que no está disponible. |
| 9 | Dejar la sesión 7 días sin actividad | Al volver, la sesión está cerrada. |

---

## Flujo 4 — Cliente: crear solicitud de servicio

**Requisito:** estar logueado como `cliente@demo.cl`.

| Paso | Acción | Resultado esperado |
| ---- | ------ | ------------------ |
| 1 | Ir a `/panel/solicitudes` | Lista de solicitudes del cliente (puede estar vacía inicialmente). |
| 2 | Click en "Nueva solicitud" | Navega a `/panel/solicitudes/nueva`. |
| 3 | Completar el formulario: equipo, descripción, comuna, urgencia | Todos los campos son requeridos. |
| 4 | Enviar la solicitud | Se crea la solicitud, redirige a la lista. La solicitud aparece con estado "abierta". |
| 5 | Click en la solicitud recién creada | Navega a `/panel/solicitudes/:id` con el detalle completo. |

---

## Flujo 5 — Proveedor: ver bandeja y enviar cotización

**Requisito:** estar logueado como `proveedor@demo.cl`.

| Paso | Acción | Resultado esperado |
| ---- | ------ | ------------------ |
| 1 | Ir a `/panel/proveedor` | Dashboard con métricas: solicitudes abiertas, total solicitudes, notificaciones sin leer. |
| 2 | Click en "Ver bandeja" o ir a `/panel/proveedor/bandeja` | Lista de solicitudes disponibles para cotizar. |
| 3 | Click en una solicitud | Navega al detalle de la solicitud. |
| 4 | Completar formulario de cotización: monto, IVA, alcance, plazo, vigencia | Campos con validación (monto > 0, plazo y vigencia son fechas futuras). |
| 5 | Enviar cotización | Se crea la cotización, aparece en la lista de cotizaciones de esa solicitud. Se genera notificación para el cliente. |

---

## Flujo 6 — Cliente: aceptar o rechazar cotización

**Requisito:** estar logueado como `cliente@demo.cl`, tener una solicitud con cotización recibida.

| Paso | Acción | Resultado esperado |
| ---- | ------ | ------------------ |
| 1 | Ir a `/panel/solicitudes/:id` de una solicitud con cotización | Se muestra la cotización con monto, alcance, plazo, vigencia. |
| 2 | Click en "Aceptar" en la cotización | La cotización cambia a estado aceptada. La solicitud pasa a "adjudicada". Se genera notificación para el proveedor. |
| 3 | Alternativa: rechazar la cotización | La cotización se marca como rechazada, la solicitud sigue abierta. |

---

## Flujo 7 — Proveedor: avanzar estados de solicitud

**Requisito:** estar logueado como `proveedor@demo.cl`, tener una solicitud adjudicada.

| Paso | Acción | Resultado esperado |
| ---- | ------ | ------------------ |
| 1 | Ir al detalle de una solicitud adjudicada | Se muestran acciones de transición de estado. |
| 2 | Marcar "En progreso" | Estado cambia a "en_progreso". Se notifica al cliente. |
| 3 | Marcar "Completada" | Estado cambia a "completada". Se notifica al cliente. |

---

## Flujo 8 — Cliente: cancelar solicitud

**Requisito:** estar logueado como `cliente@demo.cl`.

| Paso | Acción | Resultado esperado |
| ---- | ------ | ------------------ |
| 1 | Ir al detalle de una solicitud abierta | Se muestra botón de cancelar. |
| 2 | Click en "Cancelar solicitud" | La solicitud pasa a estado "cancelada". Ya no acepta cotizaciones. |

---

## Flujo 9 — Notificaciones

**Requisito:** estar logueado con cualquier cuenta.

| Paso | Acción | Resultado esperado |
| ---- | ------ | ------------------ |
| 1 | Observar el ícono de campana en el header | Muestra badge con cantidad de no leídas (o nada si son 0). |
| 2 | Click en la campana | Dropdown con las últimas 8 notificaciones. |
| 3 | Click en "Marcar todas como leídas" | Todas pasan a leídas, badge desaparece. |
| 4 | Click en una notificación con referencia | Navega a la solicitud relacionada (`/panel/solicitudes/:refId`). |

**Cómo generar notificaciones de prueba:** enviar una cotización (notifica al cliente), aceptar una cotización (notifica al proveedor), o cambiar estado de solicitud (notifica al cliente).

---

## Flujo 10 — Chat IA diagnóstico

**Ruta:** `/chat` (accesible sin login).

| Paso | Acción | Resultado esperado |
| ---- | ------ | ------------------ |
| 1 | Ir a `/chat` | Interfaz de chat con campo de mensaje. |
| 2 | Escribir "Mi aire no enfría" | Respuesta con diagnóstico: verificar filtros, gas refrigerante, compresor, etc. |
| 3 | Escribir "¿Cuánto cuesta reparar un aire?" | Respuesta con rangos de precios en CLP y recomendación de cotizar. |
| 4 | Escribir "Huele mal el aire acondicionado" | Respuesta sobre limpieza de filtros, posible acumulación de humedad/hongos. |
| 5 | Escribir "¿Cada cuánto se hace mantención?" | Respuesta con frecuencia recomendada (cada 6-12 meses). |
| 6 | Escribir algo no relacionado a HVAC | Respuesta genérica ofreciendo ayuda con climatización. |

> Sin `GEMINI_API_KEY`, las respuestas vienen del motor de reglas local. Con la key, Gemini responde con contexto HVAC chileno y el motor de reglas es fallback.

---

## Flujo 11 — Admin: verificar proveedores

**Requisito:** estar logueado como `admin@demo.cl`.

| Paso | Acción | Resultado esperado |
| ---- | ------ | ------------------ |
| 1 | Ir a `/panel/admin/verificaciones` | Tabla con proveedores pendientes de verificación (puede mostrar "Sin verificaciones pendientes" si no hay). |
| 2 | Click en "Aprobar" en un proveedor | El proveedor pasa a estado verificado. Se genera notificación al proveedor. |
| 3 | Click en "Rechazar" en un proveedor | El proveedor pasa a estado rechazado. Se genera notificación al proveedor. |

---

## Flujo 12 — Perfil y verificación del proveedor

**Requisito:** estar logueado como proveedor (por ejemplo, uno recién registrado).

| Paso | Acción | Resultado esperado |
| ---- | ------ | ------------------ |
| 1 | Ir a `/panel/proveedor` | Si no hay perfil, aviso "Completa el perfil de tu empresa"; la tarjeta de verificación muestra el estado real ("Sin verificar", "En revisión", "Verificado" o "Rechazado" con su motivo). |
| 2 | Click en "Editar perfil" / "Completar perfil" | Navega a `/panel/proveedor/perfil` (no a `/para-proveedores`). |
| 3 | Completar datos, elegir servicios del catálogo (con precio desde opcional), comuna base, radio de cobertura y horario; "Guardar perfil" | "Perfil guardado". Al recargar se conservan los servicios. |
| 4 | Ir a `/panel/proveedor/verificacion` | Los datos de empresa vienen del perfil; se declaran los documentos (sin subir archivos) y se envía. Queda "Solicitud en revision". |
| 5 | Login `admin@demo.cl` → `/panel/admin/verificaciones` | El proveedor aparece en la cola; "Aprobar" o "Rechazar" (con motivo obligatorio). |
| 6 | Volver como proveedor | Notificación "Tu empresa fue verificada" (o el motivo del rechazo) y estado actualizado. Ya aparece en `/buscar`. |

---- | ------ | ------------------ |
| 1 | Ir a `/panel/proveedor/verificacion` | Formulario o estado actual de verificación del proveedor. |
| 2 | Enviar documentos de verificación (RUT empresa, etc.) | Solicitud enviada, queda en estado "pendiente" para revisión del admin. |

---

## Flujo 13 — Página de cuenta

**Requisito:** estar logueado con cualquier cuenta.

| Paso | Acción | Resultado esperado |
| ---- | ------ | ------------------ |
| 1 | Ir a `/panel/cuenta` | Tarjeta de perfil con nombre, email, badge de rol, ID de usuario. |
| 2 | Ver "Enlaces rápidos" | Links al panel correspondiente al rol. Proveedores ven link a verificación. Clientes ven link a nueva solicitud. |
| 3 | Click en "Cerrar sesión" | Cierra sesión y redirige al inicio. |

---

## Flujo 14 — Mapa interactivo

**Ruta:** `/mapa`

| Paso | Acción | Resultado esperado |
| ---- | ------ | ------------------ |
| 1 | Ir a `/mapa` | Mapa centrado en Chile con marcadores de proveedores. |
| 2 | Click en un marcador | Popup con nombre del proveedor, servicios, rating. |
| 3 | Click en "Ver perfil" en el popup | Navega a `/proveedor/:id`. |
| 4 | Si el navegador pide ubicación y se concede | El mapa se centra en la ubicación del usuario. |

---

## Flujo 15 — Búsqueda con filtros

**Ruta:** `/buscar`

| Paso | Acción | Resultado esperado |
| ---- | ------ | ------------------ |
| 1 | Ir a `/buscar` | Lista completa de proveedores con filtros. |
| 2 | Filtrar por segmento (residencial/comercial/industrial) | Solo se muestran proveedores del segmento seleccionado. |
| 3 | Filtrar por servicio (ej: "Instalación de split") | Se filtran los resultados. |
| 4 | Filtrar por comuna | Proveedores de esa comuna. |
| 5 | Combinar filtros | Los filtros se aplican acumulativamente. |

---

## Flujo completo de extremo a extremo (E2E sugerido)

Para una prueba integral, seguir este orden:

1. **Registrar proveedor** → enviar verificación.
2. **Login admin** → aprobar verificación del proveedor.
3. **Login cliente** → crear solicitud de servicio.
4. **Login proveedor** → ver solicitud en bandeja → enviar cotización.
5. **Login cliente** → ver notificación de cotización → aceptar cotización.
6. **Login proveedor** → ver notificación de adjudicación → marcar en progreso → marcar completada.
7. **Login cliente** → verificar que la solicitud está completada.

Este flujo recorre el ciclo de vida completo de una solicitud en la plataforma.
