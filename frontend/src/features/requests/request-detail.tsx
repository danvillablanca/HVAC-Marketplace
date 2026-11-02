import { useState } from "react";
import type { Quote, ServiceRequestDetail as RequestDetailType } from "@hvac/shared";
import { formatCLP, formatDate } from "@hvac/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/features/auth/auth-context";
import { useServiceRequestDetail, useAcceptQuote, useTransitionRequest } from "./hooks";

const STATUS_LABELS: Record<string, string> = {
  abierta: "Abierta",
  con_cotizaciones: "Con cotizaciones",
  aceptada: "Aceptada",
  en_ejecucion: "En ejecución",
  completada: "Completada",
  cancelada: "Cancelada",
};

interface RequestDetailProps {
  requestId: string;
}

export function RequestDetail({ requestId }: RequestDetailProps) {
  const { role } = useAuth();
  const { data: detail, isLoading, error } = useServiceRequestDetail(requestId);
  const acceptQuote = useAcceptQuote();
  const transition = useTransitionRequest();
  const [actionError, setActionError] = useState<string | null>(null);

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (error || !detail) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {error ? "Error al cargar la solicitud." : "Solicitud no encontrada."}
        </CardContent>
      </Card>
    );
  }

  async function handleAcceptQuote(quoteId: string) {
    setActionError(null);
    try {
      await acceptQuote.mutateAsync(quoteId);
    } catch (err: any) {
      setActionError(err.message);
    }
  }

  async function handleTransition(status: string) {
    setActionError(null);
    try {
      await transition.mutateAsync({ id: requestId, status });
    } catch (err: any) {
      setActionError(err.message);
    }
  }

  const canCancel = role === "cliente" && ["abierta", "con_cotizaciones"].includes(detail.status);
  const canMarkInProgress = role === "proveedor" && detail.status === "aceptada";
  const canComplete = role === "proveedor" && detail.status === "en_ejecucion";

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle>
                {detail.equipment} — {detail.commune ?? "Sin ubicación"}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Creada el {formatDate(detail.createdAt)}
              </p>
            </div>
            <Badge>{STATUS_LABELS[detail.status] ?? detail.status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{detail.description}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span>Urgencia: {detail.urgency}</span>
            {detail.region && <span>Región: {detail.region}</span>}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {(canCancel || canMarkInProgress || canComplete) && (
        <div className="flex gap-2">
          {canCancel && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleTransition("cancelada")}
              disabled={transition.isPending}
            >
              Cancelar solicitud
            </Button>
          )}
          {canMarkInProgress && (
            <Button
              size="sm"
              onClick={() => handleTransition("en_ejecucion")}
              disabled={transition.isPending}
            >
              Marcar en ejecución
            </Button>
          )}
          {canComplete && (
            <Button
              size="sm"
              onClick={() => handleTransition("completada")}
              disabled={transition.isPending}
            >
              Marcar como completada
            </Button>
          )}
        </div>
      )}

      {actionError && <p className="text-sm text-destructive">{actionError}</p>}

      {/* Quotes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cotizaciones ({detail.quotes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {detail.quotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay cotizaciones para esta solicitud.
            </p>
          ) : (
            <div className="space-y-4">
              {detail.quotes.map((quote) => (
                <QuoteCard
                  key={quote.id}
                  quote={quote}
                  canAccept={
                    role === "cliente" &&
                    detail.status === "con_cotizaciones" &&
                    quote.status === "enviada"
                  }
                  onAccept={() => handleAcceptQuote(quote.id)}
                  accepting={acceptQuote.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Events timeline */}
      {detail.events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Historial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {detail.events.map((event) => (
                <div key={event.id} className="flex items-start gap-3 text-sm">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div>
                    <span className="font-medium">
                      {STATUS_LABELS[event.toStatus] ?? event.toStatus}
                    </span>
                    {event.note && <span className="text-muted-foreground"> — {event.note}</span>}
                    <p className="text-xs text-muted-foreground">{formatDate(event.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function QuoteCard({
  quote,
  canAccept,
  onAccept,
  accepting,
}: {
  quote: Quote;
  canAccept: boolean;
  onAccept: () => void;
  accepting: boolean;
}) {
  const statusLabels: Record<string, string> = {
    enviada: "Enviada",
    aceptada: "Aceptada",
    rechazada: "Rechazada",
    vencida: "Vencida",
  };

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-lg">{formatCLP(quote.amount)}</p>
          {quote.providerName && (
            <p className="text-sm text-muted-foreground">{quote.providerName}</p>
          )}
        </div>
        <Badge
          variant={
            quote.status === "aceptada"
              ? "success"
              : quote.status === "rechazada"
                ? "destructive"
                : "secondary"
          }
        >
          {statusLabels[quote.status] ?? quote.status}
        </Badge>
      </div>
      <Separator className="my-3" />
      <p className="text-sm">{quote.scope}</p>
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span>Plazo: {quote.deadlineDays} días</span>
        <span>Validez: {quote.validDays} días</span>
        <span>{quote.includesIva ? "IVA incluido" : "IVA no incluido"}</span>
      </div>
      {canAccept && (
        <Button size="sm" className="mt-3" onClick={onAccept} disabled={accepting}>
          {accepting ? "Aceptando..." : "Aceptar cotización"}
        </Button>
      )}
    </div>
  );
}
