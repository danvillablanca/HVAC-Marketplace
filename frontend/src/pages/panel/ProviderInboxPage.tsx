import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Inbox, MapPin, ShieldAlert } from "lucide-react";
import { SERVICE_CATALOG, URGENCY_LEVELS, type ServiceRequest } from "@hvac/shared";
import { RequireRole, useAuth } from "@/features/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { QuoteForm } from "@/features/requests";
import { useServiceRequestDetail, useServiceRequests } from "@/features/requests/hooks";
import { STATUS_LABELS } from "@/features/requests/request-detail";
import { useMyProviderProfile } from "@/features/panel";

const URGENCY_LABEL: Record<string, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  urgente: "Urgente",
};

function RequestCard({
  req,
  onClick,
  href,
}: {
  req: ServiceRequest;
  onClick?: () => void;
  href?: string;
}) {
  const body = (
    <Card className="cursor-pointer transition-colors hover:bg-muted/50" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">
            {req.serviceName ?? req.equipment} — {req.commune ?? "Sin ubicación"}
            {req.isDirect && (
              <Badge variant="default" className="ml-2 align-middle">
                Directa a tu empresa
              </Badge>
            )}
          </CardTitle>
          {req.myQuoteStatus === "aceptada" ? (
            <Badge variant="success">{STATUS_LABELS[req.status]}</Badge>
          ) : req.myQuoteStatus === "enviada" ? (
            <Badge variant="warning">Cotizada</Badge>
          ) : (
            <Badge>{req.quotesCount > 0 ? `${req.quotesCount} cotizaciones` : "Abierta"}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="line-clamp-2 text-sm text-muted-foreground">{req.description}</p>
        <p className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>Urgencia: {URGENCY_LABEL[req.urgency] ?? req.urgency}</span>
          {req.distanceKm != null && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3" /> ~{req.distanceKm} km
            </span>
          )}
          <span>{new Date(req.createdAt).toLocaleDateString("es-CL")}</span>
        </p>
      </CardContent>
    </Card>
  );
  return href ? <Link to={href}>{body}</Link> : body;
}

function ProviderInboxContent() {
  const { user } = useAuth();
  const { data: profile } = useMyProviderProfile();
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [quoteSuccess, setQuoteSuccess] = useState(false);
  const [urgency, setUrgency] = useState("");
  const [serviceId, setServiceId] = useState("");
  const { data: requests, isLoading } = useServiceRequests();

  const firstName = user?.fullName?.split(" ")[0] ?? "proveedor";

  const groups = useMemo(() => {
    const filtered = (requests ?? []).filter(
      (r) => (!urgency || r.urgency === urgency) && (!serviceId || r.serviceId === serviceId),
    );
    return {
      available: filtered.filter(
        (r) =>
          ["abierta", "con_cotizaciones"].includes(r.status) &&
          r.myQuoteStatus !== "enviada" &&
          r.myQuoteStatus !== "aceptada",
      ),
      quoted: filtered.filter((r) => r.myQuoteStatus === "enviada"),
      jobs: filtered.filter((r) => r.myQuoteStatus === "aceptada"),
    };
  }, [requests, urgency, serviceId]);

  const notVerified = profile !== undefined && profile?.verificationStatus !== "verificado";

  return (
    <section className="container-page space-y-8 py-10">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">
          <Inbox className="mr-2 inline size-7" />
          Bandeja de solicitudes
        </h1>
        <p className="mt-1 text-muted-foreground">
          Hola {firstName}, aquí ves las solicitudes dentro de tu cobertura que coinciden con tus
          servicios.
        </p>
      </header>

      {notVerified && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-sm">
              <ShieldAlert className="size-5 text-warning" />
              {profile
                ? "Recibirás solicitudes cuando tu empresa esté verificada y disponible."
                : "Completa tu perfil y verifícate para recibir solicitudes."}
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to={profile ? "/panel/proveedor/verificacion" : "/panel/proveedor/perfil"}>
                {profile ? "Ver verificación" : "Completar perfil"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

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
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label htmlFor="filter-urgency">Urgencia</Label>
              <Select
                id="filter-urgency"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
              >
                <option value="">Todas</option>
                {URGENCY_LEVELS.map((u) => (
                  <option key={u} value={u}>
                    {URGENCY_LABEL[u]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="filter-service">Servicio</Label>
              <Select
                id="filter-service"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
              >
                <option value="">Todos</option>
                {SERVICE_CATALOG.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {isLoading ? (
            <p className="text-muted-foreground">Cargando solicitudes...</p>
          ) : (
            <>
              <section className="space-y-3">
                <h2 className="text-lg font-semibold">
                  Disponibles para cotizar ({groups.available.length})
                </h2>
                {groups.available.length === 0 ? (
                  <Card>
                    <CardContent className="py-10 text-center">
                      <Inbox className="mx-auto mb-3 size-10 text-muted-foreground" />
                      <p className="font-medium">No hay solicitudes disponibles</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Te avisaremos cuando llegue una solicitud dentro de tu cobertura.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  groups.available.map((req) => (
                    <RequestCard
                      key={req.id}
                      req={req}
                      onClick={() => setSelectedRequestId(req.id)}
                    />
                  ))
                )}
              </section>

              {groups.quoted.length > 0 && (
                <section className="space-y-3">
                  <h2 className="text-lg font-semibold">
                    Cotizadas, esperando respuesta ({groups.quoted.length})
                  </h2>
                  {groups.quoted.map((req) => (
                    <RequestCard key={req.id} req={req} href={`/panel/solicitudes/${req.id}`} />
                  ))}
                </section>
              )}

              <section className="space-y-3">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <Briefcase className="size-5" /> Mis trabajos ({groups.jobs.length})
                </h2>
                {groups.jobs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Cuando un cliente acepte tu cotización, el trabajo aparecerá aquí.
                  </p>
                ) : (
                  groups.jobs.map((req) => (
                    <RequestCard key={req.id} req={req} href={`/panel/solicitudes/${req.id}`} />
                  ))
                )}
              </section>
            </>
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
            {detail.serviceName ?? detail.equipment} — {detail.commune ?? "Sin ubicación"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>{detail.description}</p>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span>Urgencia: {URGENCY_LABEL[detail.urgency] ?? detail.urgency}</span>
            {detail.region && <span>Región: {detail.region}</span>}
            {detail.distanceKm != null && <span>A ~{detail.distanceKm} km de tu base</span>}
          </div>
          <p className="text-xs text-muted-foreground">
            La dirección y los datos del cliente se muestran si acepta tu cotización.
          </p>
        </CardContent>
      </Card>

      {quoteSuccess ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-lg font-semibold text-green-600">Cotización enviada</p>
            <p className="mt-1 text-sm text-muted-foreground">
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
