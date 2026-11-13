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
| 1 | Ir a `/panel/solicitudes` | Historial del cliente con filtro por estado. |
| 2 | Click en "Nueva solicitud" | Navega a `/panel/solicitudes/nueva`. |
| 3 | Elegir tipo de servicio (opcional), equipo, urgencia, descripción (20–1.000) y comuna, o "Usar mi ubicación" | Sin comuna o con descripción corta muestra el error del campo. |
| 4 | "Publicar solicitud" | Vuelve a la lista con la solicitud "Abierta". Los proveedores elegibles (verificados, disponibles, con el servicio y con la comuna dentro de su radio) reciben la notificación "Nueva solicitud cerca de ti". |
| 5 | Click en la solicitud | Detalle con historial. |

---

## Flujo 4b — Cliente: pedir cotización a una empresa específica

| Paso | Acción | Resultado esperado |
| ---- | ------ | ------------------ |
| 1 | En el perfil de una empresa (`/proveedor/:id`) o su modal, "Pedir cotización" | Sin sesión de cliente pide ingresar. |
| 2 | Describir el requerimiento (20+ caracteres), urgencia y comuna; enviar | "Solicitud enviada" con enlace a la solicitud; en "Mis solicitudes" figura "Solicitud directa a …". |
| 3 | Entrar como esa empresa | La solicitud aparece en su panel y bandeja con "Directa a tu empresa" y notificación; ningún otro proveedor la ve. |

> Si la empresa no está verificada o no tiene cuenta en la plataforma, se informa y se sugiere publicar una solicitud general (que llega a todos los proveedores elegibles, no a los administradores).

---

## Flujo 5 — Proveedor: bandeja y cotización

**Requisito:** estar logueado como `proveedor@demo.cl` (verificado).

| Paso | Acción | Resultado esperado |
| ---- | ------ | ------------------ |
| 1 | Ir a `/panel/proveedor/bandeja` | Tres grupos: "Disponibles para cotizar", "Cotizadas" y "Mis trabajos", con filtros por urgencia y servicio. Cada tarjeta muestra comuna y distancia aproximada. |
| 2 | Click en una solicitud disponible | Detalle sin dirección ni datos del cliente ("se muestran si acepta tu cotización") y formulario de cotización. |
| 3 | Completar monto (> 0), IVA, alcance (≥ 20), plazo y vigencia (1–30 días) y enviar | "Cotización enviada". La solicitud pasa a "Con cotizaciones" y el cliente recibe la notificación. Una segunda cotización activa del mismo proveedor es rechazada (RN-04). |

> Un proveedor no verificado, no disponible o fuera de cobertura no ve la solicitud y no puede cotizarla.

---

## Flujo 6 — Cliente: comparar, aceptar o rechazar

**Requisito:** solicitud con cotizaciones (en el seed, la de La Florida de `cliente@demo.cl` tiene dos).

| Paso | Acción | Resultado esperado |
| ---- | ------ | ------------------ |
| 1 | Abrir la solicitud | Tabla comparativa: proveedor y calificación, monto (IVA), plazo, vigencia, distancia, estado; la más barata con "Menor precio". |
| 2 | "Aceptar" en una cotización | La solicitud pasa a "Aceptada"; las demás quedan "Rechazada" (RN-05). El aceptado recibe "Tu cotización fue aceptada" y el resto "no fue seleccionada". El cliente ya ve el teléfono y correo del proveedor en su perfil (RN-10). |
| 3 | Alternativa: "Rechazar" | Solo esa cotización queda rechazada; la solicitud sigue recibiendo otras. |

---

## Flujo 7 — Proveedor: ejecutar y completar

**Requisito:** estar logueado como el proveedor adjudicado.

| Paso | Acción | Resultado esperado |
| ---- | ------ | ------------------ |
| 1 | Bandeja → "Mis trabajos" → abrir el trabajo | Ahora se ve la dirección del cliente. |
| 2 | "Marcar en ejecución" | Estado "En ejecución"; el cliente es notificado. |
| 3 | "Marcar como completada" | Estado "Completada" y "Esperando la confirmación del cliente". |
| 4 | Cliente: "Confirmar trabajo realizado" | "Trabajo confirmado" y enlace "Deja tu reseña". Si no confirma, se confirma solo a los 7 días. |

> Otro proveedor, o el cliente, no pueden marcar estos estados (la RPC lo rechaza).

---

## Flujo 8 — Cliente: cancelar solicitud

| Paso | Acción | Resultado esperado |
| ---- | ------ | ------------------ |
| 1 | Abrir una solicitud "Abierta" o "Con cotizaciones" → "Cancelar solicitud" | Pide elegir un motivo obligatorio: Presupuesto alto, Proveedor encontrado por otra vía, Se resolvió el problema solo u Otro. "Confirmar cancelación" queda deshabilitado sin motivo. |
| 2 | Elegir "Otro" | Aparece "Cuéntanos el motivo" (obligatorio, mínimo 3 caracteres); con los otros motivos el comentario es opcional. |
| 3 | "Confirmar cancelación" | Estado "Cancelada", "Motivo: …" en el detalle y en el historial, cotizaciones vigentes rechazadas y aviso a los proveedores que cotizaron. Ya no acepta cotizaciones. |

---

## Flujo 9 — Notificaciones y chat

**Requisito:** sesión iniciada. Con Supabase local todo llega en vivo ("· En vivo"); en modo demo se actualiza cada 5–10 s.

| Paso | Acción | Resultado esperado |
| ---- | ------ | ------------------ |
| 1 | Observar la campana | Badge con no leídas; sube sin recargar cuando llega una notificación. |
| 2 | Click en la campana | Últimas 8 notificaciones; "Marcar todas como leídas" limpia el badge. |
| 3 | Click en una notificación | Navega a la solicitud (o al panel del proveedor si es de verificación). |
| 4 | En una solicitud con cotizaciones, sección "Mensajes" | El cliente ve una pestaña por proveedor que cotizó (con no leídos); el proveedor ve solo su conversación. |
| 5 | Escribir y "Enviar" (Enter envía, Shift+Enter salta línea) | El mensaje aparece en la otra pantalla en menos de 2 s y genera la notificación "Nuevo mensaje de …". Al abrirlo se marca "Leído". |

> Correos: cotización recibida, cotización aceptada y resultado de verificación se envían con Resend si hay `RESEND_API_KEY`; si no, quedan en el log del backend (`[email] ...`). Los correos de cuenta (recuperación, confirmación) salen en español; en local se ven en Mailpit (`http://127.0.0.1:54324`).

---- | ------ | ------------------ |
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
| 1 | Ir a `/mapa` | Mapa (teselas OpenStreetMap; MapTiler si hay `VITE_MAPTILER_KEY`) con marcadores de proveedores verificados. |
| 2 | Click en un marcador | Popup con nombre del proveedor, servicios, rating. |
| 3 | Click en "Ver perfil" en el popup | Navega a `/proveedor/:id`. |
| 4 | Si el navegador pide ubicación y se concede | El mapa se centra en la ubicación del usuario. |

---

## Flujo 15 — Búsqueda con filtros

**Ruta:** `/buscar`

| Paso | Acción | Resultado esperado |
| ---- | ------ | ------------------ |
| 1 | Ir a `/buscar` | Proveedores verificados a 10 km o menos (radio por defecto), con "Mostrando X–Y de N". |
| 2 | Elegir región y comuna (o "Usar mi ubicación") | Los resultados se calculan desde la comuna elegida ("Resultados cerca de …"). |
| 3 | Filtrar por servicio, calificación mínima, segmento o "Solo proveedores disponibles" | Se aplican de forma acumulativa. |
| 4 | Ordenar por "Mejor calificados" | Orden descendente por calificación. |
| 5 | Con más de 10 resultados, "Siguiente" / "Anterior" | Páginas de 10 ("Página 1 de N"). |

> Un proveedor solo aparece si está **verificado** y el cliente está dentro de su **radio de cobertura**. Si una empresa no aparece, su panel muestra "¿Por qué no apareces en la búsqueda?" con lo que falta.

---- | ------ | ------------------ |
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
