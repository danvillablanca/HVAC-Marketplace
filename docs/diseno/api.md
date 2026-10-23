# Contrato de API — Marketplace HVAC

> **Proyecto:** Marketplace HVAC (Grupo 1 / ASHRAE Chile) — IIC3113
> **Componente:** Backend Next.js 16 API-only (App Router + Route Handlers) + TypeScript
> **Consumidor:** Frontend React 19 + Vite mediante `apiFetch`
> **Idioma:** español (es-CL) · **Estado:** diseño E1
> **Documento hermano:** [`modelo-de-datos.md`](./modelo-de-datos.md)

---

## 1. Convenciones generales

### 1.1 Base URL y versionado

| Entorno    | Base URL                            |
| ---------- | ----------------------------------- |
| Desarrollo | `http://localhost:3001`             |
| Producción | `https://api.<dominio>` (pendiente) |

- Todas las rutas cuelgan de `/api`. El prefijo es la superficie estable del backend Next.js.
- **Versionado:** durante E1 no se versiona la ruta; los cambios incompatibles se coordinan con
  `@hvac/shared` (misma versión en monorepo). A partir de E2 se reserva el encabezado
  `X-Api-Version: 1` para evolución sin romper clientes.
- El frontend lee la base desde `VITE_API_BASE_URL` (`frontend/src/lib/env.ts`).

### 1.2 Envelope de respuesta

Toda respuesta JSON usa un sobre uniforme definido en `shared/src/types/index.ts`:

```ts
// Éxito
interface ApiSuccess<T> {
  ok: true;
  data: T;
}

// Error
interface ApiError {
  ok: false;
  error: { code: string; message: string; details?: unknown };
}

type ApiResponse<T> = ApiSuccess<T> | ApiError;
```

El cliente `apiFetch` desempaqueta `data` o lanza `ApiRequestError(message, code, status, details)`
(`frontend/src/lib/api.ts`).

### 1.3 Encabezados

| Encabezado                    | Dirección                  | Valor                                              |
| ----------------------------- | -------------------------- | -------------------------------------------------- |
| `Content-Type`                | request (con body)         | `application/json`                                 |
| `Accept`                      | request                    | `application/json`                                 |
| `Authorization`               | request (rutas protegidas) | `Bearer <JWT de Supabase>`                         |
| `Access-Control-Allow-Origin` | response                   | `FRONTEND_ORIGIN` (`http://localhost:5173` en dev) |

### 1.4 CORS

CORS se habilita con origen explícito (`FRONTEND_ORIGIN`), métodos `GET, POST, PATCH, OPTIONS` y
encabezados `Content-Type, Authorization`. Se responde `204` a `OPTIONS` (preflight). No se usa `*`
porque las rutas autenticadas envían `Authorization`.

### 1.5 Autenticación

- **JWT de Supabase** en `Authorization: Bearer <access_token>`.
- El backend valida el token con `supabase.auth.getUser(token)` y resuelve el rol desde `profiles`.
- Rutas públicas: `/api/health`, `/api/providers/search`, `/api/providers/[id]`,
  `/api/providers/[id]/reviews` (solo lectura de datos públicos).
- Rutas autenticadas exigen token válido; el rol se verifica para `admin` (verificación) y
  `proveedor`/`cliente` según el recurso.

### 1.6 Paginación

Las listas geoespaciales usan `limit` (1–50, default 20) y `offset` (≥ 0). La respuesta es un arreglo
plano; el frontend pagina por scroll. No se usa cursor en E1 por simplicidad.

---

## 2. Catálogo de endpoints

Leyenda de auth: **No** = público · **Sí** = Bearer JWT · rol indicado cuando aplica.

| #   | Método  | Ruta                          | Descripción                                     | Auth | Rol               | Query / Body                              | Respuesta (`data`)              | Estados                 |
| --- | ------- | ----------------------------- | ----------------------------------------------- | ---- | ----------------- | ----------------------------------------- | ------------------------------- | ----------------------- |
| 1   | `GET`   | `/api/health`                 | Estado del servicio y de la BD.                 | No   | —                 | —                                         | `{ status, db, version, time }` | 200, 500                |
| 2   | `GET`   | `/api/providers`              | Lista de proveedores verificados (sin geo).     | No   | —                 | `segment`, `serviceId`, `limit`, `offset` | `ProviderSummary[]`             | 200, 400                |
| 3   | `GET`   | `/api/providers/search`       | Búsqueda geoespacial por cercanía.              | No   | —                 | `nearbySearchSchema`                      | `ProviderSummary[]`             | 200, 400                |
| 4   | `GET`   | `/api/providers/[id]`         | Detalle de un proveedor.                        | No   | —                 | path `id`                                 | `ProviderDetail`                | 200, 404                |
| 5   | `GET`   | `/api/providers/[id]/reviews` | Reseñas del proveedor.                          | No   | —                 | path `id`, `limit`, `offset`              | `Review[]`                      | 200, 404                |
| 6   | `POST`  | `/api/reviews`                | Crear reseña.                                   | Sí   | cliente           | `reviewCreateSchema`                      | `Review`                        | 201, 400, 401, 403, 409 |
| 7   | `POST`  | `/api/leads`                  | Crear solicitud de servicio.                    | Sí   | cliente           | `leadCreateSchema`                        | `{ id }`                        | 201, 400, 401, 403      |
| 8   | `GET`   | `/api/leads`                  | Listar leads del usuario (cliente o proveedor). | Sí   | cliente/proveedor | `status`, `limit`, `offset`               | `Lead[]`                        | 200, 401                |
| 9   | `PATCH` | `/api/leads/[id]`             | Actualizar estado/nota del lead.                | Sí   | proveedor         | `leadUpdateSchema`                        | `Lead`                          | 200, 400, 401, 403, 404 |
| 10  | `POST`  | `/api/appointments`           | Proponer cita para un lead.                     | Sí   | proveedor         | `appointmentCreateSchema`                 | `Appointment`                   | 201, 400, 401, 403, 409 |
| 11  | `GET`   | `/api/admin/verifications`    | Bandeja de verificación.                        | Sí   | admin             | `status`, `limit`, `offset`               | `VerificationQueueItem[]`       | 200, 401, 403           |
| 12  | `PATCH` | `/api/admin/verifications`    | Decidir verificación.                           | Sí   | admin             | `verificationDecisionSchema`              | `{ providerId, status }`        | 200, 400, 401, 403, 404 |
| 13  | `POST`  | `/api/ai/chat`                | Asistente IA HVAC (**stub**).                   | Sí   | cliente           | `chatSchema`                              | `{ sessionId, reply, sources }` | 200, 400, 401, 501      |

> Los endpoints 1–5 son de lectura pública; el resto requiere JWT. `PATCH` de verificación (12) es la
> única mutación reservada a `admin` (RP1).

---

## 3. Detalle y ejemplos

Todos los ejemplos usan `curl`. Se asume `BASE=http://localhost:3001` y, en rutas protegidas,
`TOKEN=<jwt de Supabase>`.

### 3.1 `GET /api/health`

```bash
curl -s "$BASE/api/health"
```

```json
{
  "ok": true,
  "data": {
    "status": "ok",
    "db": "ok",
    "version": "0.1.0",
    "time": "2026-09-24T14:05:00.000Z"
  }
}
```

### 3.2 `GET /api/providers/search` — búsqueda geoespacial (RP3)

Valida query con `nearbySearchSchema` y llama a la RPC `nearby_providers` (PostGIS).

```bash
curl -s "$BASE/api/providers/search?lat=-33.4489&lng=-70.6693&radiusKm=10&segment=residencial&query=split&limit=20"
```

```json
{
  "ok": true,
  "data": [
    {
      "id": "8f1c2e9a-1b2c-4d3e-9f00-1122334455aa",
      "legalName": "Clima Andes SpA",
      "slug": "clima-andes-spa",
      "segment": "residencial",
      "verificationStatus": "verificado",
      "ratingAvg": 4.8,
      "reviewsCount": 132,
      "city": "Quinta Normal",
      "commune": "Quinta Normal",
      "distanceMeters": 3120.44,
      "services": ["Venta e instalacion de equipos Split", "Reparacion y carga de gas"],
      "priceFrom": 45000,
      "isDemo": false
    }
  ]
}
```

### 3.3 `GET /api/providers/[id]` — detalle de proveedor

```bash
curl -s "$BASE/api/providers/8f1c2e9a-1b2c-4d3e-9f00-1122334455aa"
```

```json
{
  "ok": true,
  "data": {
    "id": "8f1c2e9a-1b2c-4d3e-9f00-1122334455aa",
    "legalName": "Clima Andes SpA",
    "slug": "clima-andes-spa",
    "segment": "residencial",
    "verificationStatus": "verificado",
    "ratingAvg": 4.8,
    "reviewsCount": 132,
    "city": "Quinta Normal",
    "commune": "Quinta Normal",
    "distanceMeters": null,
    "services": ["Venta e instalacion de equipos Split"],
    "priceFrom": 45000,
    "isDemo": false,
    "rut": "76.543.210-K",
    "email": "contacto@climaandes.cl",
    "phone": "+56973337025",
    "description": "Ingenieria HVAC residencial y comercial...",
    "address": "Lope de Ulloa 1760, Quinta Normal",
    "location": { "lat": -33.4325, "lng": -70.7005 },
    "modalities": ["Visita a domicilio", "Garantia escrita"],
    "servicesDetailed": [
      {
        "id": "svc-1",
        "name": "Venta e instalacion de equipos Split",
        "priceFrom": 45000,
        "unit": "visita"
      }
    ]
  }
}
```

### 3.4 `POST /api/leads` — crear lead (RP4)

```bash
curl -s -X POST "$BASE/api/leads" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "providerId": "8f1c2e9a-1b2c-4d3e-9f00-1122334455aa",
    "serviceId": "3c9d1f22-55aa-4b77-8e10-99aabbccddee",
    "description": "Necesito instalar un equipo split en departamento de 2 dormitorios.",
    "urgency": "media",
    "preferredContact": "whatsapp"
  }'
```

```json
{ "ok": true, "data": { "id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" } }
```

### 3.5 `POST /api/reviews` — crear reseña (RP4)

```bash
curl -s -X POST "$BASE/api/reviews" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "providerId": "8f1c2e9a-1b2c-4d3e-9f00-1122334455aa",
    "leadId": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    "rating": 5,
    "comment": "Instalacion puntual y prolija. Explicaron el mantenimiento."
  }'
```

```json
{
  "ok": true,
  "data": {
    "id": "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
    "providerId": "8f1c2e9a-1b2c-4d3e-9f00-1122334455aa",
    "rating": 5,
    "comment": "Instalacion puntual y prolija. Explicaron el mantenimiento.",
    "authorName": "Maria Gonzalez",
    "createdAt": "2026-09-24T14:22:10.000Z",
    "verified": true
  }
}
```

### 3.6 `PATCH /api/admin/verifications` — decidir verificación (RP1)

```bash
curl -s -X PATCH "$BASE/api/admin/verifications" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "providerId": "8f1c2e9a-1b2c-4d3e-9f00-1122334455aa",
    "decision": "verificado",
    "note": "RUT y certificado ASHRAE validados."
  }'
```

```json
{
  "ok": true,
  "data": { "providerId": "8f1c2e9a-1b2c-4d3e-9f00-1122334455aa", "status": "verificado" }
}
```

### 3.7 `POST /api/ai/chat` — asistente IA (stub)

En E1 responde con un mensaje predefinido y `sources: []`; la interfaz ya es la definitiva.

```bash
curl -s -X POST "$BASE/api/ai/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "sess-001",
    "message": "Que mantenimiento necesita un split cada cuanto tiempo?"
  }'
```

```json
{
  "ok": true,
  "data": {
    "sessionId": "sess-001",
    "reply": "El asistente HVAC estara disponible en la siguiente entrega (E2/E3). Por ahora puedo ayudarte a encontrar proveedores cercanos.",
    "sources": []
  }
}
```

---

## 4. Schemas de entrada (zod)

Definidos en `shared/src/schemas/*.ts` y reutilizados por los Route Handlers con `schema.parse()`.
Los errores de validación se traducen a `validation_error` (400) con `details` (lista de issues).

| Endpoint                          | Schema                       | Campos clave                                                                                                            | Reglas                                                                                                                  |
| --------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `GET /api/providers/search`       | `nearbySearchSchema`         | `lat`, `lng`, `radiusKm`, `segment?`, `serviceId?`, `query?`, `limit`, `offset`                                         | lat ∈ [-56,-17], lng ∈ [-76,-66], radiusKm ∈ [1,100] (def. 15), limit ∈ [1,50] (def. 20), offset ≥ 0                    |
| `GET /api/providers`              | `providerListSchema`         | `segment?`, `serviceId?`, `limit`, `offset`                                                                             | mismos defaults de paginación                                                                                           |
| `POST /api/leads`                 | `leadCreateSchema`           | `providerId`, `serviceId?`, `description`, `urgency`, `preferredContact`                                                | uuid; descripción 10–2000; urgency ∈ {baja,media,alta} (def. media); canal ∈ {telefono,whatsapp,correo} (def. whatsapp) |
| `PATCH /api/leads/[id]`           | `leadUpdateSchema`           | `status`, `note?`                                                                                                       | status ∈ {nuevo,contactado,cotizado,cerrado,perdido}; note ≤ 500                                                        |
| `POST /api/reviews`               | `reviewCreateSchema`         | `providerId`, `leadId?`, `rating`, `comment?`                                                                           | uuid; rating entero 1–5; comment ≤ 1500                                                                                 |
| `POST /api/appointments`          | `appointmentCreateSchema`    | `leadId`, `startsAt`, `durationMinutes`                                                                                 | uuid; `startsAt` ISO 8601 con offset; duración 30–480 (def. 90)                                                         |
| `PATCH /api/appointments/[id]`    | `appointmentUpdateSchema`    | `status`                                                                                                                | ∈ {propuesta,confirmada,realizada,cancelada}                                                                            |
| `POST /api/admin/verifications`   | `verificationDecisionSchema` | `providerId`, `decision`, `note?`                                                                                       | uuid; decision ∈ {verificado,rechazado,en_revision}; note ≤ 500                                                         |
| `PUT/POST /api/providers` (panel) | `providerUpsertSchema`       | `legalName`, `rut`, `email`, `phone`, `segment`, `address`, `commune`, `region`, `lat`, `lng`, `modalities`, `services` | nombre 3–160; RUT válido (módulo 11); teléfono `+56`; email; lat/lng dentro de Chile; modalities ≤ 10; services ≤ 50    |
| `POST /api/ai/chat`               | `chatSchema`                 | `sessionId?`, `message`                                                                                                 | sessionId ≤ 80; message 1–2000                                                                                          |

**Fragmento de validación en el handler**

```ts
import { leadCreateSchema } from "@hvac/shared";

const parsed = leadCreateSchema.safeParse(await req.json());
if (!parsed.success) {
  return Response.json(
    {
      ok: false,
      error: { code: "validation_error", message: "Datos invalidos", details: parsed.error.issues },
    },
    { status: 400 },
  );
}
```

---

## 5. Manejo de errores

### 5.1 Códigos

| HTTP | `error.code`       | Cuándo                                              | Ejemplo de `message`                        |
| ---- | ------------------ | --------------------------------------------------- | ------------------------------------------- |
| 400  | `validation_error` | Body/query inválido (zod).                          | `Datos invalidos`                           |
| 401  | `unauthorized`     | Falta token o token inválido/expirado.              | `Sesion requerida`                          |
| 403  | `forbidden`        | Token válido sin permisos/rol.                      | `No tienes permisos para esta accion`       |
| 404  | `not_found`        | Recurso inexistente.                                | `Proveedor no encontrado`                   |
| 409  | `conflict`         | Regla de negocio (reseña duplicada, cita solapada). | `Ya existe una resena para este lead`       |
| 429  | `rate_limited`     | Exceso de solicitudes (por IP/usuario).             | `Demasiadas solicitudes, intenta mas tarde` |
| 500  | `internal_error`   | Error inesperado.                                   | `Error interno del servidor`                |
| 501  | `not_implemented`  | Módulo stub (IA).                                   | `Modulo no disponible`                      |

### 5.2 Formato

```json
{
  "ok": false,
  "error": {
    "code": "validation_error",
    "message": "Datos invalidos",
    "details": [{ "path": ["rating"], "message": "Number must be less than or equal to 5" }]
  }
}
```

**Reglas:** `message` es apto para usuario y en español; `details` solo en `validation_error`
(issues de zod) y en `conflict` (campos involucrados). Nunca se filtran trazas ni SQL.

---

## 6. Matriz de trazabilidad (endpoint → requisito → pantalla)

| Endpoint                          | RP1 | RP2 | RP3 | RP4 | Pantalla frontend                        |
| --------------------------------- | :-: | :-: | :-: | :-: | ---------------------------------------- |
| `GET /api/health`                 |     |  ✓  |     |     | — (monitoreo)                            |
| `GET /api/providers`              |     |  ✓  |     |  ✓  | `/buscar` (`SearchPage`)                 |
| `GET /api/providers/search`       |     |  ✓  |  ✓  |     | `/mapa` (`MapPage`), `/buscar`           |
| `GET /api/providers/[id]`         |  ✓  |  ✓  |  ✓  |     | `/proveedor/:id` (`ProviderPage`)        |
| `GET /api/providers/[id]/reviews` |     |  ✓  |     |  ✓  | `/proveedor/:id`                         |
| `POST /api/reviews`               |     |  ✓  |     |  ✓  | `/proveedor/:id`, `/panel/solicitudes`   |
| `POST /api/leads`                 |     |  ✓  |     |  ✓  | `/proveedor/:id`, `/panel/solicitudes`   |
| `GET /api/leads`                  |     |  ✓  |     |  ✓  | `/panel/solicitudes`, `/panel/proveedor` |
| `PATCH /api/leads/[id]`           |     |  ✓  |     |  ✓  | `/panel/proveedor`                       |
| `POST /api/appointments`          |     |  ✓  |     |  ✓  | `/panel/proveedor`                       |
| `GET /api/admin/verifications`    |  ✓  |  ✓  |     |     | `/panel/admin/verificaciones`            |
| `PATCH /api/admin/verifications`  |  ✓  |  ✓  |     |     | `/panel/admin/verificaciones`            |
| `POST /api/ai/chat`               |     |     |     |     | `/chat` (`ChatPage`)                     |
| `PUT/POST /api/providers` (panel) |  ✓  |  ✓  |  ✓  |  ✓  | `/panel/proveedor/verificacion`          |

> La ruta de upsert del proveedor (`/api/providers`) se documenta como contrato objetivo del panel;
> su handler se implementa junto al wizard de verificación (RP1).

### 6.1 Cobertura por requisito

| Requisito                         | Endpoints principales                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------------- |
| **RP1 Verificación de proveedor** | `GET/PATCH /api/admin/verifications`, `GET /api/providers/[id]`, upsert de proveedor. |
| **RP2 Consistencia de datos**     | Todos (envelope + zod + códigos de error).                                            |
| **RP3 Mapa real**                 | `GET /api/providers/search` (RPC `nearby_providers`).                                 |
| **RP4 CRUD cohesionado**          | `leads`, `appointments`, `reviews`, `providers`.                                      |

---

## 7. Rate limiting y observabilidad

- **Rate limiting (429):** límite por IP+usuario en rutas de escritura (`POST /api/leads`,
  `POST /api/reviews`) y en `/api/ai/chat` para proteger costos del proveedor LLM. Implementación en
  E2 con almacén en memoria/Upstash; en E1 se documenta el contrato.
- **Logs:** cada handler registra método, ruta, `requestId`, estado y latencia. Los errores 500 se
  correlacionan con `audit_log` cuando afectan entidades auditables.
- **`requestId`:** se propaga por encabezado `X-Request-Id` para trazabilidad.

---

## 8. Compatibilidad con `apiFetch`

El cliente `frontend/src/lib/api.ts`:

- Construye la URL como `${VITE_API_BASE_URL}${path}`.
- Envía `Authorization: Bearer <token>` cuando se provee.
- Desempaqueta `data` o lanza `ApiRequestError` con `code`, `status` y `details`.

Los hooks (`frontend/src/features/providers/hooks.ts`) usan React Query y **degradan a datos demo**
(`frontend/src/data/providers.ts`) si la API falla, manteniendo la demo operativa (mitiga R1).

---

## 9. Seguridad

| Tema          | Medida                                                                                 |
| ------------- | -------------------------------------------------------------------------------------- |
| Autenticación | JWT de Supabase validado en servidor; nunca se confía en el rol del cliente.           |
| Autorización  | Verificación de rol desde `profiles` + RLS como última línea de defensa.               |
| Secretos      | `SUPABASE_SERVICE_ROLE_KEY` y `GEMINI_API_KEY` solo en el backend (nunca en `VITE_*`). |
| Entrada       | Validación zod en la frontera; consultas parametrizadas vía cliente Supabase.          |
| Salida        | Los errores no exponen SQL, trazas ni claves.                                          |
| CORS          | Origen explícito, no comodín.                                                          |

---

## 10. Módulo IA: estado y plan E2/E3

### 10.1 Estado actual (E1) — stub

`POST /api/ai/chat` está implementado como **stub**: valida `chatSchema`, exige JWT y devuelve un
`reply` fijo con `sources: []`. El contrato de request/response ya es el definitivo, de modo que el
frontend (`/chat`) no cambiará al conectar el RAG.

```ts
// app/api/ai/chat/route.ts (esquema)
export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return unauthorized();
  const parsed = chatSchema.safeParse(await req.json());
  if (!parsed.success) return validationError(parsed.error);
  return Response.json({
    ok: true,
    data: {
      sessionId: parsed.data.sessionId ?? crypto.randomUUID(),
      reply: "El asistente HVAC estara disponible en E2/E3...",
      sources: [],
    },
  });
}
```

### 10.2 Plan E2/E3 — RAG con Gemini + pgvector

**Objetivo:** responder consultas técnicas HVAC (mantenimiento, normativa ASHRAE) citando fuentes.

| Etapa         | Acción                                                                                         | Artefactos                                    |
| ------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Ingesta       | Cargar documentos (ASHRAE, manuales) en `documents`.                                           | `supabase/seed` o script `scripts/ingest.ts`  |
| Fragmentación | Dividir en `document_chunks` (~500–800 tokens, solape ~15%).                                   | `chunk_index` determinista                    |
| Embeddings    | Generar con Gemini `gemini-embedding-001` (1536 dims) y persistir en `embedding`.              | `GEMINI_API_KEY`, `GEMINI_EMBEDDING_DIM=1536` |
| Retrieval     | Embedding de la consulta → RPC `match_documents(query_embedding, match_count)` (coseno `<=>`). | Índice HNSW                                   |
| Generación    | Prompt con contexto recuperado → Gemini `gemini-2.5-flash`.                                    | `GEMINI_CHAT_MODEL`                           |
| Respuesta     | Devolver `reply` + `sources[]` (título/URL del documento y score).                             | Contrato sin cambios                          |
| Guardrails    | Limitar a contexto HVAC; si no hay fuentes, responder con fallback.                            | —                                             |
| Costos        | Rate limiting (429) y caché de embeddings de consultas frecuentes.                             | §7                                            |

**Flujo resumido**

```text
usuario → /api/ai/chat → embed(message) → match_documents(top-k)
        → prompt(contexto + pregunta) → Gemini → { reply, sources }
```

**Criterios de aceptación E2/E3**

- `sources` no vacío cuando exista material relevante.
- Latencia objetivo p95 < 4 s.
- Cero alucinaciones de normativa: toda afirmación técnica cita una fuente recuperada.
- El contrato de `/api/ai/chat` no cambia respecto de E1 (compatibilidad con el frontend).

---

## 11. Anexos

- Tipos compartidos: `shared/src/types/index.ts`.
- Schemas: `shared/src/schemas/{auth,provider,review,lead,appointment,search}.ts`.
- Cliente HTTP: `frontend/src/lib/api.ts`; hooks: `frontend/src/features/providers/hooks.ts`.
- Modelo de datos: [`modelo-de-datos.md`](./modelo-de-datos.md).
- Variables de entorno: `.env.example`.
