import { randomUUID } from "node:crypto";
import {
  SERVICE_CATALOG,
  findCommune,
  type Quote,
  type QuoteCreateInput,
  type RequestEvent,
  type RequestStatus,
  type ServiceRequest,
  type ServiceRequestCreateInput,
  type ServiceRequestDetail,
} from "@hvac/shared";
import type { AuthenticatedUser } from "../lib/auth";
import { getServiceClient } from "../lib/supabase";
import { isDemoMode } from "../lib/env";
import { HttpError } from "../lib/http";
import { distanceMeters } from "../data/demo";
import { createNotification } from "./notifications";
import { listDemoProfiles } from "./provider-profile";

type Row = Record<string, any>;
type DemoRequest = ServiceRequest & {
  lat: number | null;
  lng: number | null;
  quotes: Quote[];
  events: RequestEvent[];
};

/** COT-03: sin respuesta del cliente, el trabajo se confirma solo a los 7 dias. */
export const AUTO_CONFIRM_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

const STATUS_LABEL: Record<RequestStatus, string> = {
  abierta: "abierta",
  con_cotizaciones: "con cotizaciones",
  aceptada: "aceptada",
  en_ejecucion: "en ejecución",
  completada: "completada",
  cancelada: "cancelada",
};

function notify(params: Parameters<typeof createNotification>[0]): void {
  void createNotification(params).catch(() => undefined);
}

function serviceName(id: string | null | undefined): string | null {
  return id ? (SERVICE_CATALOG.find((s) => s.id === id)?.name ?? null) : null;
}

/** Traduce los errores de las RPC (codigos definidos en la migracion 0009). */
function rpcError(error: { code?: string; message: string }): HttpError {
  if (error.code === "42501") return new HttpError("forbidden", error.message, 403);
  if (error.code === "P0002") return new HttpError("not_found", error.message, 404);
  if (error.code === "23505") {
    return new HttpError("duplicate", "Ya tienes una cotización activa para esta solicitud", 409);
  }
  return new HttpError("transition_error", error.message, 400);
}

// =============================================================================
// Modo demo: mismas reglas que las RPC, en memoria
// =============================================================================

const demoRequests = new Map<string, DemoRequest>();

function requireDemo(): void {
  if (!isDemoMode) throw new HttpError("service_unavailable", "Base de datos no disponible", 503);
}

/** RN-03 en modo demo. */
function demoEligible(
  r: DemoRequest,
): Array<{ providerId: string; userId: string; meters: number }> {
  if (r.lat == null || r.lng == null) return [];
  const result: Array<{ providerId: string; userId: string; meters: number }> = [];
  for (const { userId, profile } of listDemoProfiles()) {
    const base = findCommune(profile.commune);
    if (!base || profile.verificationStatus !== "verificado" || !profile.isAvailable) continue;
    if (r.serviceId && !profile.services.some((s) => s.serviceId === r.serviceId)) continue;
    const meters = distanceMeters({ lat: base.lat, lng: base.lng }, { lat: r.lat, lng: r.lng });
    if (meters <= profile.coverageRadiusKm * 1000)
      result.push({ providerId: profile.id, userId, meters });
  }
  return result;
}

function demoProviderOf(userId: string) {
  return listDemoProfiles().find((p) => p.userId === userId)?.profile ?? null;
}

function demoExpire(r: DemoRequest): void {
  const now = Date.now();
  for (const q of r.quotes) {
    if (q.status === "enviada" && Date.parse(q.createdAt) + q.validDays * DAY_MS < now) {
      q.status = "vencida";
    }
  }
}

function demoActiveQuotes(r: DemoRequest): number {
  return r.quotes.filter((q) => q.status === "enviada" || q.status === "aceptada").length;
}

function demoPublic(r: DemoRequest): ServiceRequest {
  const { quotes: _q, events: _e, lat: _lat, lng: _lng, ...rest } = r;
  return { ...rest, quotesCount: demoActiveQuotes(r), ...autoConfirm(rest) };
}

function demoEvent(
  r: DemoRequest,
  actorId: string | null,
  from: RequestStatus | null,
  to: RequestStatus,
  note: string | null,
) {
  r.events.push({
    id: randomUUID(),
    requestId: r.id,
    actorId,
    fromStatus: from,
    toStatus: to,
    note,
    createdAt: new Date().toISOString(),
  });
}

/** Vista limitada del proveedor (SOL-02): sin direccion ni cliente antes de adjudicarse. */
function forProvider(
  r: ServiceRequest,
  distanceKm: number | null,
  myQuoteStatus: Quote["status"] | null,
): ServiceRequest {
  const awarded = myQuoteStatus === "aceptada";
  return {
    ...r,
    clientId: awarded ? r.clientId : "",
    address: awarded ? r.address : null,
    distanceKm,
    myQuoteStatus,
  };
}

// =============================================================================
// Supabase
// =============================================================================

function mapRequestRow(row: Row): ServiceRequest {
  return {
    id: String(row.id),
    clientId: String(row.client_id ?? ""),
    serviceId: row.service_id ?? null,
    serviceName: row.services?.name ?? row.service_name ?? serviceName(row.service_id),
    equipment: row.equipment ?? "otro",
    description: String(row.description ?? ""),
    urgency: row.urgency ?? "media",
    status: row.status ?? "abierta",
    commune: row.commune ?? null,
    region: row.region ?? null,
    address: row.address ?? null,
    photos: Array.isArray(row.photos) ? row.photos : [],
    quotesCount: Number(row.quotes_count ?? 0),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? row.created_at ?? new Date().toISOString()),
    completedAt: row.completed_at ?? null,
    clientConfirmedAt: row.client_confirmed_at ?? null,
  };
}

function mapQuoteRow(row: Row, distances: Map<string, number> = new Map()): Quote {
  const meters = distances.get(String(row.provider_id));
  return {
    id: String(row.id),
    requestId: String(row.request_id),
    providerId: String(row.provider_id),
    providerName: row.providers?.legal_name ?? null,
    providerRating: row.providers?.rating_avg != null ? Number(row.providers.rating_avg) : null,
    providerReviews: Number(row.providers?.reviews_count ?? 0),
    providerSlug: row.providers?.slug ?? null,
    distanceKm: meters != null ? Math.round(meters / 100) / 10 : null,
    amount: Number(row.amount),
    includesIva: Boolean(row.includes_iva),
    scope: String(row.scope ?? ""),
    deadlineDays: Number(row.deadline_days),
    validDays: Number(row.valid_days),
    status: row.status,
    createdAt: String(row.created_at),
  };
}

function mapEventRow(row: Row): RequestEvent {
  return {
    id: String(row.id),
    requestId: String(row.request_id),
    actorId: row.actor_id ?? null,
    fromStatus: row.from_status ?? null,
    toStatus: row.to_status,
    note: row.note ?? null,
    createdAt: String(row.created_at),
  };
}

/** COT-03: confirmacion automatica perezosa tras AUTO_CONFIRM_DAYS sin respuesta. */
function autoConfirm(r: Pick<ServiceRequest, "status" | "completedAt" | "clientConfirmedAt">) {
  if (r.status !== "completada" || r.clientConfirmedAt || !r.completedAt) {
    return { clientConfirmedAt: r.clientConfirmedAt ?? null };
  }
  const due = Date.parse(r.completedAt) + AUTO_CONFIRM_DAYS * DAY_MS;
  return { clientConfirmedAt: Date.now() >= due ? new Date(due).toISOString() : null };
}

async function providerIdOf(db: any, userId: string): Promise<string | null> {
  const { data } = await db.from("providers").select("id").eq("user_id", userId).maybeSingle();
  return data ? String(data.id) : null;
}

async function requireProviderId(user: AuthenticatedUser): Promise<string> {
  const db = getServiceClient();
  const id = db ? await providerIdOf(db, user.id) : (demoProviderOf(user.id)?.id ?? null);
  if (!id)
    throw new HttpError("profile_required", "Completa el perfil de tu empresa para cotizar", 409);
  return id;
}

async function expireAndAutoConfirm(db: any): Promise<void> {
  await db.rpc("expire_quotes");
  await db
    .from("service_requests")
    .update({ client_confirmed_at: new Date().toISOString() })
    .eq("status", "completada")
    .is("client_confirmed_at", null)
    .lt("completed_at", new Date(Date.now() - AUTO_CONFIRM_DAYS * DAY_MS).toISOString());
}

const REQUEST_SELECT = "*, services(name)";

// =============================================================================
// API del servicio
// =============================================================================

/** SOL-03 / SOL-05: solicitudes del cliente, bandeja del proveedor o todas (admin). */
export async function listRequests(user: AuthenticatedUser): Promise<ServiceRequest[]> {
  const db = getServiceClient();
  if (!db) {
    requireDemo();
    const all = [...demoRequests.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    all.forEach(demoExpire);
    if (user.role === "admin") return all.map(demoPublic);
    if (user.role === "cliente") return all.filter((r) => r.clientId === user.id).map(demoPublic);
    const provider = demoProviderOf(user.id);
    if (!provider) return [];
    return all.flatMap((r) => {
      if (r.status === "cancelada") return [];
      const mine = [...r.quotes].reverse().find((q) => q.providerId === provider.id) ?? null;
      const eligible = demoEligible(r).find((e) => e.providerId === provider.id);
      const open = r.status === "abierta" || r.status === "con_cotizaciones";
      const visible =
        (open && (eligible || mine?.status === "enviada")) || mine?.status === "aceptada";
      if (!visible) return [];
      const base = findCommune(provider.commune);
      const meters =
        base && r.lat != null && r.lng != null
          ? distanceMeters({ lat: base.lat, lng: base.lng }, { lat: r.lat, lng: r.lng })
          : null;
      return [
        forProvider(
          demoPublic(r),
          meters == null ? null : Math.round(meters / 100) / 10,
          mine?.status ?? null,
        ),
      ];
    });
  }

  await expireAndAutoConfirm(db);

  if (user.role === "proveedor") {
    const providerId = await providerIdOf(db, user.id);
    if (!providerId) return [];
    const { data, error } = await db.rpc("provider_inbox", { p_provider_id: providerId });
    if (error) throw new HttpError("db_error", "No se pudo obtener la bandeja", 502, error.message);
    return (data ?? []).map((row: Row) =>
      forProvider(
        mapRequestRow({ ...row, client_id: "", address: null }),
        row.distance_km != null ? Number(row.distance_km) : null,
        row.my_quote_status ?? null,
      ),
    );
  }

  let query = db
    .from("service_requests")
    .select(`${REQUEST_SELECT}, quotes(status)`)
    .order("created_at", { ascending: false });
  if (user.role === "cliente") query = query.eq("client_id", user.id);
  const { data, error } = await query;
  if (error)
    throw new HttpError("db_error", "No se pudieron listar las solicitudes", 502, error.message);
  return (data ?? []).map((row: Row) => {
    const r = mapRequestRow({
      ...row,
      quotes_count: (row.quotes ?? []).filter(
        (q: Row) => q.status === "enviada" || q.status === "aceptada",
      ).length,
    });
    return { ...r, ...autoConfirm(r) };
  });
}

export async function getRequestDetail(
  requestId: string,
  user: AuthenticatedUser,
): Promise<ServiceRequestDetail> {
  const db = getServiceClient();
  if (!db) {
    requireDemo();
    const r = demoRequests.get(requestId);
    if (!r) throw new HttpError("not_found", "Solicitud no encontrada", 404);
    demoExpire(r);
    const distances = new Map(demoEligible(r).map((e) => [e.providerId, e.meters]));
    const quotes = r.quotes.map((q) => {
      const meters = distances.get(q.providerId);
      return { ...q, distanceKm: meters != null ? Math.round(meters / 100) / 10 : null };
    });
    if (user.role === "admin" || r.clientId === user.id) {
      return { ...demoPublic(r), quotes, events: r.events };
    }
    if (user.role === "proveedor") {
      const listed = (await listRequests(user)).find((x) => x.id === requestId);
      const provider = demoProviderOf(user.id);
      if (listed && provider) {
        return {
          ...listed,
          quotes: quotes.filter((q) => q.providerId === provider.id),
          events: r.events,
        };
      }
    }
    throw new HttpError("forbidden", "No tienes acceso a esta solicitud", 403);
  }

  await expireAndAutoConfirm(db);
  const { data: row, error } = await db
    .from("service_requests")
    .select(REQUEST_SELECT)
    .eq("id", requestId)
    .maybeSingle();
  if (error) throw new HttpError("db_error", "Error al obtener la solicitud", 502, error.message);
  if (!row) throw new HttpError("not_found", "Solicitud no encontrada", 404);

  const [{ data: quotesData }, { data: eventsData }, { data: eligibleData }] = await Promise.all([
    db
      .from("quotes")
      .select("*, providers(legal_name, slug, rating_avg, reviews_count)")
      .eq("request_id", requestId)
      .order("created_at", { ascending: true }),
    db
      .from("service_request_events")
      .select("*")
      .eq("request_id", requestId)
      .order("created_at", { ascending: true }),
    db.rpc("eligible_providers_for_request", { p_request_id: requestId }),
  ]);
  const distances = new Map<string, number>(
    (eligibleData ?? []).map((e: Row) => [String(e.provider_id), Number(e.distance_meters)]),
  );
  const quotes = (quotesData ?? []).map((q: Row) => mapQuoteRow(q, distances));
  const events = (eventsData ?? []).map(mapEventRow);
  const request = mapRequestRow({
    ...row,
    quotes_count: quotes.filter((q: Quote) => q.status === "enviada" || q.status === "aceptada")
      .length,
  });
  const full = { ...request, ...autoConfirm(request) };

  if (user.role === "admin" || full.clientId === user.id) return { ...full, quotes, events };

  if (user.role === "proveedor") {
    const providerId = await providerIdOf(db, user.id);
    const listed = providerId
      ? (await listRequests(user)).find((x) => x.id === requestId)
      : undefined;
    if (listed && providerId) {
      // Adjudicado: ve la fila completa (direccion y cliente); si no, la vista limitada.
      const base =
        listed.myQuoteStatus === "aceptada"
          ? { ...full, distanceKm: listed.distanceKm, myQuoteStatus: listed.myQuoteStatus }
          : listed;
      return { ...base, quotes: quotes.filter((q: Quote) => q.providerId === providerId), events };
    }
  }
  throw new HttpError("forbidden", "No tienes acceso a esta solicitud", 403);
}

/** SOL-01 / SOL-02: crea la solicitud y avisa a los proveedores elegibles. */
export async function createRequest(
  input: ServiceRequestCreateInput,
  clientId: string,
): Promise<ServiceRequest> {
  const commune = findCommune(input.commune);
  if (!commune) throw new HttpError("validation_error", "Comuna no reconocida", 422);
  const lat = input.lat ?? commune.lat;
  const lng = input.lng ?? commune.lng;

  const db = getServiceClient();
  let created: ServiceRequest;
  let eligibleUsers: string[];

  if (!db) {
    requireDemo();
    const now = new Date().toISOString();
    const r: DemoRequest = {
      id: randomUUID(),
      clientId,
      serviceId: input.serviceId ?? null,
      serviceName: serviceName(input.serviceId),
      equipment: input.equipment ?? "otro",
      description: input.description,
      urgency: input.urgency ?? "media",
      status: "abierta",
      commune: commune.name,
      region: commune.region,
      address: input.address ?? null,
      photos: input.photos ?? [],
      quotesCount: 0,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      clientConfirmedAt: null,
      lat,
      lng,
      quotes: [],
      events: [],
    };
    demoEvent(r, clientId, null, "abierta", "Solicitud creada");
    demoRequests.set(r.id, r);
    created = demoPublic(r);
    eligibleUsers = demoEligible(r).map((e) => e.userId);
  } else {
    const { data, error } = await db
      .from("service_requests")
      .insert({
        client_id: clientId,
        service_id: input.serviceId ?? null,
        equipment: input.equipment ?? "otro",
        description: input.description,
        urgency: input.urgency ?? "media",
        commune: commune.name,
        region: commune.region,
        address: input.address ?? null,
        photos: input.photos ?? [],
        geom: `SRID=4326;POINT(${lng} ${lat})`,
      })
      .select(REQUEST_SELECT)
      .single();
    if (error) throw new HttpError("db_error", "No se pudo crear la solicitud", 502, error.message);
    await db.from("service_request_events").insert({
      request_id: data.id,
      actor_id: clientId,
      to_status: "abierta",
      note: "Solicitud creada",
    });
    created = mapRequestRow(data);
    const { data: eligible } = await db.rpc("eligible_providers_for_request", {
      p_request_id: data.id,
    });
    eligibleUsers = (eligible ?? []).map((e: Row) => e.user_id).filter(Boolean);
  }

  for (const userId of eligibleUsers) {
    notify({
      userId,
      type: "nueva_solicitud",
      title: "Nueva solicitud cerca de ti",
      body: `${created.serviceName ?? "Servicio HVAC"} en ${created.commune}. Urgencia: ${created.urgency}.`,
      refType: "request",
      refId: created.id,
    });
  }
  return created;
}

/** SOL-04 / SOL-05: transiciones validadas por actor y rol. */
export async function transitionRequest(
  requestId: string,
  newStatus: "en_ejecucion" | "completada" | "cancelada",
  user: AuthenticatedUser,
  note?: string,
): Promise<ServiceRequest> {
  const db = getServiceClient();
  let request: ServiceRequest;
  let quotedProviderUsers: string[] = [];

  if (!db) {
    requireDemo();
    const r = demoRequests.get(requestId);
    if (!r) throw new HttpError("not_found", "Solicitud no encontrada", 404);
    const provider = demoProviderOf(user.id);
    const awarded = Boolean(
      provider && r.quotes.some((q) => q.providerId === provider.id && q.status === "aceptada"),
    );
    const from = r.status;
    if (newStatus === "cancelada") {
      if (r.clientId !== user.id)
        throw new HttpError("forbidden", "Solo el cliente puede cancelar su solicitud", 403);
      if (from !== "abierta" && from !== "con_cotizaciones") {
        throw new HttpError(
          "transition_error",
          "Solo se puede cancelar una solicitud abierta o con cotizaciones",
          400,
        );
      }
      r.quotes.filter((q) => q.status === "enviada").forEach((q) => (q.status = "rechazada"));
    } else {
      if (!awarded)
        throw new HttpError(
          "forbidden",
          "Solo el proveedor adjudicado puede actualizar el trabajo",
          403,
        );
      const expected = newStatus === "en_ejecucion" ? "aceptada" : "en_ejecucion";
      if (from !== expected) {
        throw new HttpError(
          "transition_error",
          `Transición no permitida: ${from} -> ${newStatus}`,
          400,
        );
      }
    }
    r.status = newStatus;
    r.updatedAt = new Date().toISOString();
    if (newStatus === "completada") r.completedAt = r.updatedAt;
    demoEvent(r, user.id, from, newStatus, note ?? null);
    request = demoPublic(r);
    quotedProviderUsers = listDemoProfiles()
      .filter((p) => r.quotes.some((q) => q.providerId === p.profile.id))
      .map((p) => p.userId);
  } else {
    const { error } = await db.rpc("transition_request", {
      p_request_id: requestId,
      p_new_status: newStatus,
      p_actor: user.id,
      p_note: note ?? null,
    });
    if (error) throw rpcError(error);
    const { data } = await db
      .from("service_requests")
      .select(REQUEST_SELECT)
      .eq("id", requestId)
      .single();
    request = mapRequestRow(data);
    const { data: quoted } = await db
      .from("quotes")
      .select("providers(user_id)")
      .eq("request_id", requestId);
    quotedProviderUsers = (quoted ?? []).map((q: Row) => q.providers?.user_id).filter(Boolean);
  }

  if (newStatus === "cancelada") {
    for (const userId of quotedProviderUsers) {
      notify({
        userId,
        type: "solicitud_actualizada",
        title: "Una solicitud que cotizaste fue cancelada",
        body: note ? `Motivo: ${note}` : "El cliente canceló la solicitud.",
        refType: "request",
        refId: requestId,
      });
    }
  } else {
    notify({
      userId: request.clientId,
      type: "solicitud_actualizada",
      title: `Tu solicitud está ${STATUS_LABEL[newStatus]}`,
      body:
        newStatus === "completada"
          ? `El proveedor marcó el trabajo como completado. Confírmalo para dejar tu reseña (se confirma solo en ${AUTO_CONFIRM_DAYS} días).`
          : (note ?? "El proveedor inició el trabajo."),
      refType: "request",
      refId: requestId,
    });
  }
  return request;
}

/** COT-03: el cliente confirma el trabajo completado. */
export async function confirmCompletion(
  requestId: string,
  user: AuthenticatedUser,
): Promise<ServiceRequest> {
  const db = getServiceClient();
  if (!db) {
    requireDemo();
    const r = demoRequests.get(requestId);
    if (!r) throw new HttpError("not_found", "Solicitud no encontrada", 404);
    if (r.clientId !== user.id)
      throw new HttpError("forbidden", "Solo el cliente puede confirmar el trabajo", 403);
    if (r.status !== "completada" || r.clientConfirmedAt) {
      throw new HttpError(
        "transition_error",
        "La solicitud no está pendiente de confirmación",
        400,
      );
    }
    r.clientConfirmedAt = new Date().toISOString();
    demoEvent(r, user.id, "completada", "completada", "El cliente confirmó el trabajo");
    return demoPublic(r);
  }
  const { error } = await db.rpc("confirm_completion", {
    p_request_id: requestId,
    p_actor: user.id,
  });
  if (error) throw rpcError(error);
  const { data } = await db
    .from("service_requests")
    .select(REQUEST_SELECT)
    .eq("id", requestId)
    .single();
  return mapRequestRow(data);
}

/** COT-01: el proveedor elegible cotiza (D-19: se usa su id de proveedor, no el de usuario). */
export async function createQuote(
  input: QuoteCreateInput,
  user: AuthenticatedUser,
): Promise<Quote> {
  const providerId = await requireProviderId(user);
  const db = getServiceClient();
  let quote: Quote;
  let clientId: string;

  if (!db) {
    const r = demoRequests.get(input.requestId);
    if (!r) throw new HttpError("not_found", "Solicitud no encontrada", 404);
    demoExpire(r);
    if (r.status !== "abierta" && r.status !== "con_cotizaciones") {
      throw new HttpError("transition_error", "La solicitud ya no recibe cotizaciones", 400);
    }
    if (!demoEligible(r).some((e) => e.providerId === providerId)) {
      throw new HttpError("forbidden", "Tu empresa no es elegible para esta solicitud", 403);
    }
    if (
      r.quotes.some(
        (q) => q.providerId === providerId && (q.status === "enviada" || q.status === "aceptada"),
      )
    ) {
      throw new HttpError("duplicate", "Ya tienes una cotización activa para esta solicitud", 409);
    }
    const provider = demoProviderOf(user.id);
    quote = {
      id: randomUUID(),
      requestId: r.id,
      providerId,
      providerName: provider?.legalName ?? null,
      providerSlug: provider?.slug ?? null,
      providerRating: null,
      providerReviews: 0,
      amount: input.amount,
      includesIva: input.includesIva ?? true,
      scope: input.scope,
      deadlineDays: input.deadlineDays,
      validDays: input.validDays ?? 15,
      status: "enviada",
      createdAt: new Date().toISOString(),
    };
    r.quotes.push(quote);
    if (r.status === "abierta") {
      r.status = "con_cotizaciones";
      demoEvent(r, null, "abierta", "con_cotizaciones", "Primera cotización recibida");
    }
    clientId = r.clientId;
  } else {
    const { data: quoteId, error } = await db.rpc("create_quote", {
      p_request_id: input.requestId,
      p_provider_id: providerId,
      p_amount: input.amount,
      p_includes_iva: input.includesIva ?? true,
      p_scope: input.scope,
      p_deadline_days: input.deadlineDays,
      p_valid_days: input.validDays ?? 15,
    });
    if (error) throw rpcError(error);
    const { data } = await db
      .from("quotes")
      .select(
        "*, providers(legal_name, slug, rating_avg, reviews_count), service_requests(client_id)",
      )
      .eq("id", quoteId)
      .single();
    quote = mapQuoteRow(data);
    clientId = data.service_requests.client_id;
  }

  notify({
    userId: clientId,
    type: "nueva_cotizacion",
    title: "Nueva cotización recibida",
    body: `${quote.providerName ?? "Un proveedor"} te envió una cotización por $${quote.amount.toLocaleString("es-CL")}.`,
    refType: "request",
    refId: quote.requestId,
  });
  return quote;
}

/** COT-02: el cliente acepta (rechaza el resto, RN-05) o rechaza una cotizacion. */
export async function decideQuote(
  quoteId: string,
  action: "aceptar" | "rechazar",
  user: AuthenticatedUser,
): Promise<{ requestId: string; status: Quote["status"] }> {
  const db = getServiceClient();
  let requestId: string;
  let outcome: Array<{ userId: string; accepted: boolean; amount: number }> = [];

  if (!db) {
    requireDemo();
    const r = [...demoRequests.values()].find((x) => x.quotes.some((q) => q.id === quoteId));
    if (!r) throw new HttpError("not_found", "Cotización no encontrada", 404);
    demoExpire(r);
    const q = r.quotes.find((x) => x.id === quoteId)!;
    if (r.clientId !== user.id)
      throw new HttpError("forbidden", "Solo el cliente de la solicitud puede decidir", 403);
    if (q.status !== "enviada")
      throw new HttpError(
        "transition_error",
        `La cotización ya no está vigente (${q.status})`,
        400,
      );
    const owners = new Map(listDemoProfiles().map((p) => [p.profile.id, p.userId]));
    if (action === "rechazar") {
      q.status = "rechazada";
      outcome = [{ userId: owners.get(q.providerId) ?? "", accepted: false, amount: q.amount }];
    } else {
      if (r.status !== "con_cotizaciones") {
        throw new HttpError(
          "transition_error",
          `La solicitud no admite aceptar cotizaciones (${r.status})`,
          400,
        );
      }
      const rejected = r.quotes.filter((x) => x.id !== quoteId && x.status === "enviada");
      q.status = "aceptada";
      rejected.forEach((x) => (x.status = "rechazada"));
      const from = r.status;
      r.status = "aceptada";
      demoEvent(r, user.id, from, "aceptada", "Cotización aceptada");
      outcome = [
        { userId: owners.get(q.providerId) ?? "", accepted: true, amount: q.amount },
        ...rejected.map((x) => ({
          userId: owners.get(x.providerId) ?? "",
          accepted: false,
          amount: x.amount,
        })),
      ];
    }
    requestId = r.id;
  } else {
    const before = await db.from("quotes").select("request_id").eq("id", quoteId).maybeSingle();
    const pending = before.data
      ? await db
          .from("quotes")
          .select("id, amount, status, providers(user_id)")
          .eq("request_id", before.data.request_id)
          .eq("status", "enviada")
      : { data: [] };
    const { data, error } = await db.rpc(action === "aceptar" ? "accept_quote" : "reject_quote", {
      p_quote_id: quoteId,
      p_actor: user.id,
    });
    if (error) throw rpcError(error);
    requestId = String(data);
    outcome = (pending.data ?? [])
      .filter((q: Row) => action === "aceptar" || q.id === quoteId)
      .map((q: Row) => ({
        userId: q.providers?.user_id ?? "",
        accepted: action === "aceptar" && q.id === quoteId,
        amount: Number(q.amount),
      }));
  }

  // NOT-01: se avisa a todos los proveedores involucrados.
  for (const o of outcome.filter((x) => x.userId)) {
    notify({
      userId: o.userId,
      type: o.accepted ? "cotizacion_aceptada" : "cotizacion_rechazada",
      title: o.accepted ? "Tu cotización fue aceptada" : "Tu cotización no fue seleccionada",
      body: o.accepted
        ? `El cliente aceptó tu cotización por $${o.amount.toLocaleString("es-CL")}. Ya puedes ver sus datos de contacto.`
        : "El cliente eligió otra opción o rechazó tu cotización.",
      refType: "request",
      refId: requestId,
    });
  }
  return { requestId, status: action === "aceptar" ? "aceptada" : "rechazada" };
}

/** RN-10 (demo): el cliente tiene una cotizacion aceptada del proveedor. */
export function demoHasAcceptedQuote(clientId: string, providerId: string): boolean {
  for (const r of demoRequests.values()) {
    if (r.clientId !== clientId) continue;
    if (r.quotes.some((q) => q.providerId === providerId && q.status === "aceptada")) return true;
  }
  return false;
}

/** Solo para tests. */
export function resetDemoRequests(): void {
  demoRequests.clear();
}

/** Participantes posibles de los hilos de una solicitud (MSG-01). */
export interface ThreadContext {
  requestId: string;
  clientId: string;
  providers: Array<{ providerId: string; providerName: string | null; userId: string | null }>;
}

export async function getThreadContext(requestId: string): Promise<ThreadContext> {
  const db = getServiceClient();
  if (!db) {
    requireDemo();
    const r = demoRequests.get(requestId);
    if (!r) throw new HttpError("not_found", "Solicitud no encontrada", 404);
    const owners = new Map(listDemoProfiles().map((p) => [p.profile.id, p]));
    const seen = new Set<string>();
    return {
      requestId,
      clientId: r.clientId,
      providers: r.quotes
        .filter((q) => !seen.has(q.providerId) && seen.add(q.providerId))
        .map((q) => ({
          providerId: q.providerId,
          providerName: owners.get(q.providerId)?.profile.legalName ?? q.providerName,
          userId: owners.get(q.providerId)?.userId ?? null,
        })),
    };
  }
  const { data: request } = await db
    .from("service_requests")
    .select("client_id")
    .eq("id", requestId)
    .maybeSingle();
  if (!request) throw new HttpError("not_found", "Solicitud no encontrada", 404);
  const { data: quotes } = await db
    .from("quotes")
    .select("provider_id, providers(legal_name, user_id)")
    .eq("request_id", requestId);
  const unique = new Map<string, ThreadContext["providers"][number]>();
  for (const q of quotes ?? []) {
    unique.set(String(q.provider_id), {
      providerId: String(q.provider_id),
      providerName: q.providers?.legal_name ?? null,
      userId: q.providers?.user_id ?? null,
    });
  }
  return { requestId, clientId: String(request.client_id), providers: [...unique.values()] };
}
