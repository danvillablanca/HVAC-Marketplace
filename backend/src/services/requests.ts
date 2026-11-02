import { randomUUID } from "node:crypto";
import type {
  ServiceRequest,
  ServiceRequestDetail,
  Quote,
  RequestEvent,
  ServiceRequestCreateInput,
  QuoteCreateInput,
  UserRole,
  RequestStatus,
} from "@hvac/shared";
import { getServiceClient } from "../lib/supabase";
import { isDemoMode } from "../lib/env";
import { HttpError } from "../lib/http";
import { createNotification } from "./notifications";

// ---- Demo fallback ----
const demoRequests = new Map<
  string,
  ServiceRequest & { quotes: Quote[]; events: RequestEvent[] }
>();

/** Visibilidad demo: el proveedor ve solicitudes abiertas a cotizar y las que ya cotizó. */
function demoCanSee(
  r: ServiceRequest & { quotes: Quote[] },
  userId: string,
  role: UserRole,
): boolean {
  if (role === "admin" || r.clientId === userId) return true;
  if (role !== "proveedor") return false;
  return (
    ["abierta", "con_cotizaciones"].includes(r.status) ||
    r.quotes.some((q) => q.providerId === userId)
  );
}

function mapRequestRow(row: Record<string, any>): ServiceRequest {
  return {
    id: String(row.id),
    clientId: String(row.client_id ?? row.clientId ?? ""),
    serviceId: row.service_id ?? row.serviceId ?? null,
    serviceName: row.service_name ?? row.serviceName ?? null,
    equipment: row.equipment ?? "otro",
    description: String(row.description ?? ""),
    urgency: row.urgency ?? "media",
    status: row.status ?? "abierta",
    commune: row.commune ?? null,
    region: row.region ?? null,
    address: row.address ?? null,
    photos: Array.isArray(row.photos) ? row.photos : [],
    quotesCount: Number(row.quotes_count ?? row.quotesCount ?? 0),
    createdAt: String(row.created_at ?? row.createdAt ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? row.updatedAt ?? new Date().toISOString()),
  };
}

function mapQuoteRow(row: Record<string, any>): Quote {
  return {
    id: String(row.id),
    requestId: String(row.request_id ?? row.requestId ?? ""),
    providerId: String(row.provider_id ?? row.providerId ?? ""),
    providerName: row.provider_name ?? row.providerName ?? null,
    amount: Number(row.amount),
    includesIva: Boolean(row.includes_iva ?? row.includesIva ?? true),
    scope: String(row.scope ?? ""),
    deadlineDays: Number(row.deadline_days ?? row.deadlineDays ?? 0),
    validDays: Number(row.valid_days ?? row.validDays ?? 15),
    status: row.status ?? "enviada",
    createdAt: String(row.created_at ?? row.createdAt ?? new Date().toISOString()),
  };
}

function mapEventRow(row: Record<string, any>): RequestEvent {
  return {
    id: String(row.id),
    requestId: String(row.request_id ?? row.requestId ?? ""),
    actorId: row.actor_id ?? row.actorId ?? null,
    fromStatus: row.from_status ?? row.fromStatus ?? null,
    toStatus: row.to_status ?? row.toStatus ?? "abierta",
    note: row.note ?? null,
    createdAt: String(row.created_at ?? row.createdAt ?? new Date().toISOString()),
  };
}

// ---- Service functions ----

export async function listRequests(userId: string, role: UserRole): Promise<ServiceRequest[]> {
  const supabase = getServiceClient();
  if (!supabase) {
    if (!isDemoMode) throw new HttpError("service_unavailable", "Base de datos no disponible", 503);
    return [...demoRequests.values()]
      .filter((r) => demoCanSee(r, userId, role))
      .map(({ quotes: _q, events: _e, ...r }) => ({ ...r, quotesCount: _q.length }));
  }

  let query = supabase
    .from("service_requests")
    .select("*, quotes(count)")
    .order("created_at", { ascending: false });

  if (role === "cliente") {
    query = query.eq("client_id", userId);
  }
  // proveedores y admin ven todas (filtrado por RLS)

  const { data, error } = await query;
  if (error) {
    throw new HttpError("db_error", "No se pudieron listar las solicitudes", 502, error.message);
  }

  return (data ?? []).map((row: any) => ({
    ...mapRequestRow(row),
    quotesCount: row.quotes?.[0]?.count ?? 0,
  }));
}

export async function getRequestDetail(
  requestId: string,
  userId: string,
  role: UserRole,
): Promise<ServiceRequestDetail> {
  const supabase = getServiceClient();
  if (!supabase) {
    if (!isDemoMode) throw new HttpError("service_unavailable", "Base de datos no disponible", 503);
    const r = demoRequests.get(requestId);
    if (!r) throw new HttpError("not_found", "Solicitud no encontrada", 404);
    if (!demoCanSee(r, userId, role)) {
      throw new HttpError("forbidden", "No tienes acceso a esta solicitud", 403);
    }
    return { ...r, quotesCount: r.quotes.length };
  }

  const { data, error } = await supabase
    .from("service_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();
  if (error) throw new HttpError("db_error", "Error al obtener solicitud", 502, error.message);
  if (!data) throw new HttpError("not_found", "Solicitud no encontrada", 404);

  // Obtener cotizaciones con nombre del proveedor
  const { data: quotesData } = await supabase
    .from("quotes")
    .select("*, providers(legal_name)")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });

  const quotes = (quotesData ?? []).map((q: any) => ({
    ...mapQuoteRow(q),
    providerName: q.providers?.legal_name ?? null,
  }));

  // Obtener eventos
  const { data: eventsData } = await supabase
    .from("service_request_events")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });

  const events = (eventsData ?? []).map((e: any) => mapEventRow(e));

  return {
    ...mapRequestRow(data),
    quotesCount: quotes.length,
    quotes,
    events,
  };
}

export async function createRequest(
  input: ServiceRequestCreateInput,
  clientId: string,
): Promise<ServiceRequest> {
  const supabase = getServiceClient();
  if (!supabase) {
    if (!isDemoMode) throw new HttpError("service_unavailable", "Base de datos no disponible", 503);
    const id = randomUUID();
    const now = new Date().toISOString();
    const req: ServiceRequest & { quotes: Quote[]; events: RequestEvent[] } = {
      id,
      clientId,
      serviceId: input.serviceId ?? null,
      serviceName: null,
      equipment: input.equipment ?? "otro",
      description: input.description,
      urgency: input.urgency ?? "media",
      status: "abierta",
      commune: input.commune ?? null,
      region: input.region ?? null,
      address: input.address ?? null,
      photos: input.photos ?? [],
      quotesCount: 0,
      createdAt: now,
      updatedAt: now,
      quotes: [],
      events: [
        {
          id: randomUUID(),
          requestId: id,
          actorId: clientId,
          fromStatus: null,
          toStatus: "abierta",
          note: "Solicitud creada",
          createdAt: now,
        },
      ],
    };
    demoRequests.set(id, req);
    const { quotes: _q, events: _e, ...result } = req;
    return result;
  }

  const insertData: Record<string, unknown> = {
    client_id: clientId,
    service_id: input.serviceId ?? null,
    equipment: input.equipment ?? "otro",
    description: input.description,
    urgency: input.urgency ?? "media",
    commune: input.commune ?? null,
    region: input.region ?? null,
    address: input.address ?? null,
    photos: input.photos ?? [],
  };

  if (input.lat != null && input.lng != null) {
    insertData.geom = `SRID=4326;POINT(${input.lng} ${input.lat})`;
  }

  const { data, error } = await supabase
    .from("service_requests")
    .insert(insertData)
    .select("*")
    .single();
  if (error) {
    throw new HttpError("db_error", "No se pudo crear la solicitud", 502, error.message);
  }

  // Crear evento inicial
  await supabase.from("service_request_events").insert({
    request_id: data.id,
    actor_id: clientId,
    to_status: "abierta",
    note: "Solicitud creada",
  });

  return { ...mapRequestRow(data), quotesCount: 0 };
}

export async function transitionRequest(
  requestId: string,
  newStatus: RequestStatus,
  userId: string,
  note?: string,
): Promise<ServiceRequest> {
  const supabase = getServiceClient();
  if (!supabase) {
    if (!isDemoMode) throw new HttpError("service_unavailable", "Base de datos no disponible", 503);
    const r = demoRequests.get(requestId);
    if (!r) throw new HttpError("not_found", "Solicitud no encontrada", 404);
    const oldStatus = r.status;
    r.status = newStatus;
    r.updatedAt = new Date().toISOString();
    r.events.push({
      id: randomUUID(),
      requestId,
      actorId: userId,
      fromStatus: oldStatus,
      toStatus: newStatus,
      note: note ?? null,
      createdAt: r.updatedAt,
    });
    // Notificar al cliente sobre el cambio de estado
    if (r.clientId !== userId) {
      void createNotification({
        userId: r.clientId,
        type: "solicitud_actualizada",
        title: `Solicitud actualizada a "${newStatus}"`,
        body: note ?? `Tu solicitud cambió de "${oldStatus}" a "${newStatus}".`,
        refType: "request",
        refId: requestId,
      }).catch(() => {});
    }
    return { ...r, quotesCount: r.quotes.length };
  }

  // RPC handles validation
  const { error } = await supabase.rpc("transition_request", {
    p_request_id: requestId,
    p_new_status: newStatus,
    p_note: note ?? null,
  });
  if (error) throw new HttpError("transition_error", error.message, 400);

  const { data } = await supabase.from("service_requests").select("*").eq("id", requestId).single();

  // Notificar al cliente sobre el cambio de estado (si no fue el cliente quien lo cambió)
  if (data && data.client_id !== userId) {
    void createNotification({
      userId: data.client_id,
      type: "solicitud_actualizada",
      title: `Solicitud actualizada a "${newStatus}"`,
      body: note ?? `Tu solicitud cambió a "${newStatus}".`,
      refType: "request",
      refId: requestId,
    }).catch(() => {});
  }

  return mapRequestRow(data);
}

export async function createQuote(input: QuoteCreateInput, providerId: string): Promise<Quote> {
  const supabase = getServiceClient();
  if (!supabase) {
    if (!isDemoMode) throw new HttpError("service_unavailable", "Base de datos no disponible", 503);
    const r = demoRequests.get(input.requestId);
    if (!r) throw new HttpError("not_found", "Solicitud no encontrada", 404);
    // RN-04: una sola cotización por proveedor y solicitud
    if (r.quotes.some((q) => q.providerId === providerId)) {
      throw new HttpError("duplicate", "Ya enviaste una cotización para esta solicitud", 409);
    }
    const quote: Quote = {
      id: randomUUID(),
      requestId: input.requestId,
      providerId,
      providerName: "Proveedor Demo",
      amount: input.amount,
      includesIva: input.includesIva ?? true,
      scope: input.scope,
      deadlineDays: input.deadlineDays,
      validDays: input.validDays ?? 15,
      status: "enviada",
      createdAt: new Date().toISOString(),
    };
    r.quotes.push(quote);
    // Actualizar estado si es la primera cotización
    if (r.status === "abierta") {
      r.status = "con_cotizaciones";
    }
    // Notificar al cliente
    void createNotification({
      userId: r.clientId,
      type: "nueva_cotizacion",
      title: "Nueva cotización recibida",
      body: `${quote.providerName ?? "Un proveedor"} te envió una cotización por $${quote.amount.toLocaleString("es-CL")}.`,
      refType: "request",
      refId: r.id,
    }).catch(() => {});
    return quote;
  }

  const { data, error } = await supabase
    .from("quotes")
    .insert({
      request_id: input.requestId,
      provider_id: providerId,
      amount: input.amount,
      includes_iva: input.includesIva ?? true,
      scope: input.scope,
      deadline_days: input.deadlineDays,
      valid_days: input.validDays ?? 15,
    })
    .select("*, providers(legal_name)")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new HttpError("duplicate", "Ya enviaste una cotización para esta solicitud", 409);
    }
    throw new HttpError("db_error", "No se pudo crear la cotización", 502, error.message);
  }

  // Actualizar estado de la solicitud si es la primera cotización
  await supabase
    .from("service_requests")
    .update({ status: "con_cotizaciones" })
    .eq("id", input.requestId)
    .eq("status", "abierta");

  // Notificar al cliente
  const { data: reqData } = await supabase
    .from("service_requests")
    .select("client_id")
    .eq("id", input.requestId)
    .single();
  if (reqData) {
    void createNotification({
      userId: reqData.client_id,
      type: "nueva_cotizacion",
      title: "Nueva cotización recibida",
      body: `${data.providers?.legal_name ?? "Un proveedor"} te envió una cotización por $${data.amount.toLocaleString("es-CL")}.`,
      refType: "request",
      refId: input.requestId,
    }).catch(() => {});
  }

  return {
    ...mapQuoteRow(data),
    providerName: data.providers?.legal_name ?? null,
  };
}

export async function acceptQuote(quoteId: string, userId: string): Promise<void> {
  const supabase = getServiceClient();
  if (!supabase) {
    if (!isDemoMode) throw new HttpError("service_unavailable", "Base de datos no disponible", 503);
    // Demo: find and accept
    for (const r of demoRequests.values()) {
      const q = r.quotes.find((q) => q.id === quoteId);
      if (q) {
        q.status = "aceptada";
        r.quotes
          .filter((oq) => oq.id !== quoteId)
          .forEach((oq) => {
            oq.status = "rechazada";
          });
        r.status = "aceptada";
        // Notificar al proveedor
        void createNotification({
          userId: q.providerId,
          type: "cotizacion_aceptada",
          title: "Tu cotización fue aceptada",
          body: `El cliente aceptó tu cotización por $${q.amount.toLocaleString("es-CL")}.`,
          refType: "request",
          refId: r.id,
        }).catch(() => {});
        return;
      }
    }
    throw new HttpError("not_found", "Cotización no encontrada", 404);
  }

  // Get quote details before accepting (for notification)
  const { data: quoteData } = await supabase
    .from("quotes")
    .select("provider_id, amount, request_id")
    .eq("id", quoteId)
    .single();

  const { error } = await supabase.rpc("accept_quote", { p_quote_id: quoteId });
  if (error) throw new HttpError("accept_error", error.message, 400);

  // Notificar al proveedor
  if (quoteData) {
    void createNotification({
      userId: quoteData.provider_id,
      type: "cotizacion_aceptada",
      title: "Tu cotización fue aceptada",
      body: `El cliente aceptó tu cotización por $${quoteData.amount.toLocaleString("es-CL")}.`,
      refType: "request",
      refId: quoteData.request_id,
    }).catch(() => {});
  }
}

export async function listProviderQuotes(providerId: string): Promise<Quote[]> {
  const supabase = getServiceClient();
  if (!supabase) {
    if (!isDemoMode) throw new HttpError("service_unavailable", "Base de datos no disponible", 503);
    const quotes: Quote[] = [];
    for (const r of demoRequests.values()) {
      quotes.push(...r.quotes.filter((q) => q.providerId === providerId));
    }
    return quotes;
  }

  const { data, error } = await supabase
    .from("quotes")
    .select("*, providers(legal_name)")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });
  if (error)
    throw new HttpError("db_error", "No se pudieron listar las cotizaciones", 502, error.message);
  return (data ?? []).map((row: any) => ({
    ...mapQuoteRow(row),
    providerName: row.providers?.legal_name ?? null,
  }));
}
