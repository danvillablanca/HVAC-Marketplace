import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Clock, MapPin, Star } from "lucide-react";
import type { Quote, ServiceRequestDetail } from "@hvac/shared";
import { formatCLP, formatDate } from "@hvac/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/auth-context";
import { RequestChat } from "@/features/chat";
import {
  useConfirmCompletion,
  useDecideQuote,
  useServiceRequestDetail,
  useTransitionRequest,
} from "./hooks";

export const STATUS_LABELS: Record<string, string> = {
  abierta: "Abierta",
  con_cotizaciones: "Con cotizaciones",
  aceptada: "Aceptada",
  en_ejecucion: "En ejecución",
  completada: "Completada",
  cancelada: "Cancelada",
};

const QUOTE_STATUS: Record<
  Quote["status"],
  { label: string; variant: "default" | "success" | "destructive" | "secondary" }
> = {
  enviada: { label: "Enviada", variant: "default" },
  aceptada: { label: "Aceptada", variant: "success" },
  rechazada: { label: "Rechazada", variant: "destructive" },
  vencida: { label: "Vencida", variant: "secondary" },
};

const EQUIPMENT: Record<string, string> = {
  split: "Split",
  ducto: "Ducto",
  chiller: "Chiller",
  vrf: "VRF",
  camara_frio: "Cámara de frío",
  otro: "Otro equipo",
};

function validUntil(quote: Quote): string {
  return formatDate(
    new Date(Date.parse(quote.createdAt) + quote.validDays * 86400000).toISOString(),
  );
}

interface RequestDetailProps {
  requestId: string;
}

export function RequestDetail({ requestId }: RequestDetailProps) {
  const { role, user } = useAuth();
  const { data: detail, isLoading, error } = useServiceRequestDetail(requestId);
  const decideQuote = useDecideQuote();
  const transition = useTransitionRequest();
  const confirm = useConfirmCompletion();
  const [actionError, setActionError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (error || !detail) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {error ? "No tienes acceso a esta solicitud o no existe." : "Solicitud no encontrada."}
        </CardContent>
      </Card>
    );
  }

  async function run(action: () => Promise<unknown>) {
    setActionError(null);
    try {
      await action();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo completar la acción.");
    }
  }

  const isOwner = role === "cliente" && detail.clientId === user?.id;
  const isAwarded = role === "proveedor" && detail.myQuoteStatus === "aceptada";
  const open = detail.status === "abierta" || detail.status === "con_cotizaciones";
  const accepted = detail.quotes.find((q) => q.status === "aceptada");
  const pendingConfirmation = detail.status === "completada" && !detail.clientConfirmedAt;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle>
                {detail.serviceName ?? EQUIPMENT[detail.equipment] ?? detail.equipment} —{" "}
                {detail.commune ?? "Sin ubicación"}
              </CardTitle>
              <CardDescription className="mt-1">
                Creada el {formatDate(detail.createdAt)} · Equipo: {EQUIPMENT[detail.equipment]}
                {detail.targetProviderName && ` · Solicitud directa a ${detail.targetProviderName}`}
                {detail.isDirect && " · Solicitud directa a tu empresa"}
              </CardDescription>
            </div>
            <Badge>{STATUS_LABELS[detail.status] ?? detail.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">{detail.description}</p>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>Urgencia: {detail.urgency}</span>
            {detail.region && <span>Región: {detail.region}</span>}
            {detail.distanceKm != null && (
              <span className="flex items-center gap-1">
                <MapPin className="size-4" /> A {detail.distanceKm} km de tu base
              </span>
            )}
            {detail.address && <span>Dirección: {detail.address}</span>}
          </div>
          {role === "proveedor" && !isAwarded && (
            <p className="text-xs text-muted-foreground">
              La dirección y los datos del cliente se muestran si el cliente acepta tu cotización.
            </p>
          )}

          {/* Acciones del cliente */}
          {isOwner && open && !cancelling && (
            <Button variant="destructive" size="sm" onClick={() => setCancelling(true)}>
              Cancelar solicitud
            </Button>
          )}
          {isOwner && cancelling && (
            <div className="space-y-2 rounded-md border border-border p-3">
              <label htmlFor="cancel-reason" className="text-sm font-medium">
                Motivo (opcional)
              </label>
              <Textarea
                id="cancel-reason"
                rows={2}
                maxLength={500}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ej: ya resolví el problema"
              />
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={transition.isPending}
                  onClick={() =>
                    run(() =>
                      transition.mutateAsync({
                        id: requestId,
                        status: "cancelada",
                        note: cancelReason.trim() || undefined,
                      }),
                    ).then(() => setCancelling(false))
                  }
                >
                  Confirmar cancelación
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setCancelling(false)}>
                  Volver
                </Button>
              </div>
            </div>
          )}
          {isOwner && pendingConfirmation && (
            <div className="space-y-2 rounded-md border border-primary/40 bg-primary/5 p-3">
              <p className="text-sm">
                El proveedor marcó el trabajo como completado. Confírmalo si quedó conforme (se
                confirma automáticamente a los 7 días).
              </p>
              <Button
                size="sm"
                disabled={confirm.isPending}
                onClick={() => run(() => confirm.mutateAsync(requestId))}
              >
                Confirmar trabajo realizado
              </Button>
            </div>
          )}
          {detail.status === "completada" && detail.clientConfirmedAt && (
            <p className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="size-4" /> Trabajo confirmado el{" "}
              {formatDate(detail.clientConfirmedAt)}.
              {isOwner && accepted?.providerSlug && (
                <Link
                  to={`/proveedor/${accepted.providerSlug}`}
                  className="font-medium text-primary hover:underline"
                >
                  Deja tu reseña
                </Link>
              )}
            </p>
          )}

          {/* Acciones del proveedor adjudicado */}
          {isAwarded && detail.status === "aceptada" && (
            <Button
              size="sm"
              disabled={transition.isPending}
              onClick={() =>
                run(() => transition.mutateAsync({ id: requestId, status: "en_ejecucion" }))
              }
            >
              Marcar en ejecución
            </Button>
          )}
          {isAwarded && detail.status === "en_ejecucion" && (
            <Button
              size="sm"
              disabled={transition.isPending}
              onClick={() =>
                run(() => transition.mutateAsync({ id: requestId, status: "completada" }))
              }
            >
              Marcar como completada
            </Button>
          )}
          {isAwarded && pendingConfirmation && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="size-4" /> Esperando la confirmación del cliente.
            </p>
          )}

          {actionError && (
            <p role="alert" className="text-sm text-destructive">
              {actionError}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Cotizaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {role === "proveedor" ? "Tu cotización" : `Cotizaciones (${detail.quotes.length})`}
          </CardTitle>
          {isOwner && detail.quotes.length > 1 && (
            <CardDescription>
              Compara monto, plazo, calificación y distancia antes de elegir.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {detail.quotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {role === "proveedor"
                ? "Aún no envías una cotización para esta solicitud."
                : "Aún no hay cotizaciones. Te avisaremos cuando llegue la primera."}
            </p>
          ) : isOwner ? (
            <QuoteComparison
              detail={detail}
              pending={decideQuote.isPending}
              onDecide={(quoteId, action) =>
                run(() => decideQuote.mutateAsync({ quoteId, action }))
              }
            />
          ) : (
            <div className="space-y-3">
              {detail.quotes.map((quote) => (
                <QuoteSummary key={quote.id} quote={quote} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* MSG-01: el chat se habilita desde la primera cotizacion. */}
      {detail.quotes.length > 0 && (isOwner || role === "proveedor") && (
        <RequestChat requestId={requestId} />
      )}

      {detail.events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Historial</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {detail.events.map((event) => (
                <li key={event.id} className="flex flex-wrap items-baseline gap-2 text-sm">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(event.createdAt)}
                  </span>
                  <span className="font-medium">
                    {STATUS_LABELS[event.toStatus] ?? event.toStatus}
                  </span>
                  {event.note && <span className="text-muted-foreground">— {event.note}</span>}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/** COT-02: tabla comparativa para el cliente. */
function QuoteComparison({
  detail,
  pending,
  onDecide,
}: {
  detail: ServiceRequestDetail;
  pending: boolean;
  onDecide: (quoteId: string, action: "aceptar" | "rechazar") => void;
}) {
  const canDecide = detail.status === "con_cotizaciones";
  const cheapest = Math.min(
    ...detail.quotes.filter((q) => q.status === "enviada").map((q) => q.amount),
  );
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="py-2 pr-3 font-medium">Proveedor</th>
            <th className="py-2 pr-3 font-medium">Monto</th>
            <th className="py-2 pr-3 font-medium">Plazo</th>
            <th className="py-2 pr-3 font-medium">Vigente hasta</th>
            <th className="py-2 pr-3 font-medium">Distancia</th>
            <th className="py-2 pr-3 font-medium">Estado</th>
            <th className="py-2 font-medium">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {detail.quotes.map((quote) => (
            <tr key={quote.id} className="border-b border-border align-top last:border-0">
              <td className="py-3 pr-3">
                {quote.providerSlug ? (
                  <Link
                    to={`/proveedor/${quote.providerSlug}`}
                    className="font-medium hover:underline"
                  >
                    {quote.providerName ?? "Proveedor"}
                  </Link>
                ) : (
                  <span className="font-medium">{quote.providerName ?? "Proveedor"}</span>
                )}
                {quote.providerRating != null && (
                  <span className="ml-1 inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                    <Star className="size-3 fill-current text-warning" />{" "}
                    {quote.providerRating.toFixed(1)} ({quote.providerReviews ?? 0})
                  </span>
                )}
                <p className="mt-1 max-w-xs text-xs text-muted-foreground">{quote.scope}</p>
              </td>
              <td className="py-3 pr-3">
                <span className="font-semibold">{formatCLP(quote.amount)}</span>
                <span className="block text-xs text-muted-foreground">
                  {quote.includesIva ? "IVA incluido" : "+ IVA"}
                </span>
                {quote.status === "enviada" &&
                  quote.amount === cheapest &&
                  detail.quotes.length > 1 && (
                    <Badge variant="success" className="mt-1">
                      Menor precio
                    </Badge>
                  )}
              </td>
              <td className="py-3 pr-3">{quote.deadlineDays} días</td>
              <td className="py-3 pr-3">{validUntil(quote)}</td>
              <td className="py-3 pr-3">
                {quote.distanceKm != null ? `${quote.distanceKm} km` : "—"}
              </td>
              <td className="py-3 pr-3">
                <Badge variant={QUOTE_STATUS[quote.status].variant}>
                  {QUOTE_STATUS[quote.status].label}
                </Badge>
              </td>
              <td className="py-3">
                {canDecide && quote.status === "enviada" && (
                  <div className="flex flex-col gap-1">
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() => onDecide(quote.id, "aceptar")}
                    >
                      Aceptar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => onDecide(quote.id, "rechazar")}
                    >
                      Rechazar
                    </Button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QuoteSummary({ quote }: { quote: Quote }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-lg font-semibold">{formatCLP(quote.amount)}</p>
        <Badge variant={QUOTE_STATUS[quote.status].variant}>
          {QUOTE_STATUS[quote.status].label}
        </Badge>
      </div>
      <p className="mt-2 text-sm">{quote.scope}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        {quote.includesIva ? "IVA incluido" : "+ IVA"} · Plazo {quote.deadlineDays} días · Vigente
        hasta {validUntil(quote)}
      </p>
    </div>
  );
}
