import { useState } from "react";
import { Link } from "react-router-dom";
import { Inbox } from "lucide-react";
import { RequireRole, useAuth } from "@/features/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RequestList, QuoteForm } from "@/features/requests";
import { useServiceRequests, useServiceRequestDetail } from "@/features/requests/hooks";

function ProviderInboxContent() {
  const { user } = useAuth();
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [quoteSuccess, setQuoteSuccess] = useState(false);
  const { data: requests, isLoading } = useServiceRequests();

  const firstName = user?.fullName?.split(" ")[0] ?? "proveedor";

  return (
    <section className="container-page space-y-8 py-10">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">
          <Inbox className="inline size-7 mr-2" />
          Bandeja de solicitudes
        </h1>
        <p className="mt-1 text-muted-foreground">
          Hola {firstName}, aquí puedes ver y cotizar solicitudes de servicio.
        </p>
      </header>

      {selectedRequestId ? (
        <SelectedRequestView
          requestId={selectedRequestId}
          onBack={() => {
            setSelectedRequestId(null);
            setQuoteSuccess(false);
          }}
          quoteSuccess={quoteSuccess}
          onQuoteSuccess={() => setQuoteSuccess(true)}
        />
      ) : (
        <>
          {isLoading ? (
            <p className="text-muted-foreground">Cargando solicitudes...</p>
          ) : !requests || requests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Inbox className="mx-auto size-12 text-muted-foreground mb-3" />
                <p className="font-medium">No hay solicitudes disponibles</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Las nuevas solicitudes de clientes aparecerán aquí.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {requests
                .filter((r) => ["abierta", "con_cotizaciones"].includes(r.status))
                .map((req) => (
                  <Card
                    key={req.id}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() => setSelectedRequestId(req.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">
                          {req.equipment} — {req.commune ?? "Sin ubicación"}
                        </CardTitle>
                        <Badge variant={req.status === "abierta" ? "default" : "warning"}>
                          {req.status === "abierta" ? "Abierta" : `${req.quotesCount} cotizaciones`}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {req.description}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">Urgencia: {req.urgency}</p>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function SelectedRequestView({
  requestId,
  onBack,
  quoteSuccess,
  onQuoteSuccess,
}: {
  requestId: string;
  onBack: () => void;
  quoteSuccess: boolean;
  onQuoteSuccess: () => void;
}) {
  const { data: detail, isLoading } = useServiceRequestDetail(requestId);

  if (isLoading) return <p className="text-muted-foreground">Cargando detalle...</p>;
  if (!detail) return <p className="text-destructive">Solicitud no encontrada.</p>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack}>
        ← Volver a la bandeja
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>
            {detail.equipment} — {detail.commune ?? "Sin ubicación"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>{detail.description}</p>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span>Urgencia: {detail.urgency}</span>
            {detail.region && <span>Región: {detail.region}</span>}
          </div>
        </CardContent>
      </Card>

      {quoteSuccess ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-lg font-semibold text-green-600">Cotización enviada</p>
            <p className="text-sm text-muted-foreground mt-1">
              El cliente será notificado de tu cotización.
            </p>
            <Button variant="outline" className="mt-4" onClick={onBack}>
              Volver a la bandeja
            </Button>
          </CardContent>
        </Card>
      ) : (
        <QuoteForm requestId={requestId} onSuccess={onQuoteSuccess} />
      )}
    </div>
  );
}

export default function ProviderInboxPage() {
  return (
    <RequireRole roles={["proveedor"]}>
      <ProviderInboxContent />
    </RequireRole>
  );
}
