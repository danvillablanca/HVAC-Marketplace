import { useState } from "react";
import { Link } from "react-router-dom";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { ServiceRequest, RequestStatus } from "@hvac/shared";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCLP, formatDate } from "@hvac/shared";
import { useServiceRequests } from "./hooks";

const STATUS_CONFIG: Record<
  RequestStatus,
  { label: string; variant: "default" | "secondary" | "warning" | "success" | "destructive" }
> = {
  abierta: { label: "Abierta", variant: "default" },
  con_cotizaciones: { label: "Con cotizaciones", variant: "warning" },
  aceptada: { label: "Aceptada", variant: "success" },
  en_ejecucion: { label: "En ejecución", variant: "secondary" },
  completada: { label: "Completada", variant: "success" },
  cancelada: { label: "Cancelada", variant: "destructive" },
};

const EQUIPMENT_LABELS: Record<string, string> = {
  split: "Split",
  ducto: "Ducto",
  chiller: "Chiller",
  vrf: "VRF",
  camara_frio: "Cámara de frío",
  otro: "Otro",
};

const URGENCY_LABELS: Record<string, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  urgente: "Urgente",
};

interface RequestListProps {
  showLink?: boolean;
}

export function RequestList({ showLink = true }: RequestListProps) {
  const { data: allRequests, isLoading, error } = useServiceRequests();
  const [statusFilter, setStatusFilter] = useState("todas");
  const requests =
    statusFilter === "todas" ? allRequests : allRequests?.filter((r) => r.status === statusFilter);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Error al cargar las solicitudes. Intenta de nuevo.
        </CardContent>
      </Card>
    );
  }

  if (!allRequests || allRequests.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No tienes solicitudes de servicio aún.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* SOL-05: historial con filtro por estado */}
      <div className="flex items-center gap-2">
        <Label htmlFor="status-filter" className="text-sm">
          Estado
        </Label>
        <Select
          id="status-filter"
          className="w-56"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="todas">Todas ({allRequests.length})</option>
          {Object.entries(STATUS_CONFIG).map(([value, config]) => (
            <option key={value} value={value}>
              {config.label} ({allRequests.filter((r) => r.status === value).length})
            </option>
          ))}
        </Select>
      </div>
      {requests?.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No hay solicitudes con ese estado.
        </p>
      )}
      {requests?.map((req) => (
        <RequestCard key={req.id} request={req} showLink={showLink} />
      ))}
    </div>
  );
}

function RequestCard({ request, showLink }: { request: ServiceRequest; showLink: boolean }) {
  const status = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.abierta;
  const content = (
    <Card className="transition-colors hover:bg-muted/50">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base">
              {request.serviceName ?? EQUIPMENT_LABELS[request.equipment] ?? request.equipment}
              {request.commune && (
                <span className="font-normal text-muted-foreground"> — {request.commune}</span>
              )}
            </CardTitle>
            {request.targetProviderName && (
              <p className="text-xs font-medium text-primary">
                Solicitud directa a {request.targetProviderName}
              </p>
            )}
            <p className="line-clamp-2 text-sm text-muted-foreground">{request.description}</p>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>Urgencia: {URGENCY_LABELS[request.urgency] ?? request.urgency}</span>
          <span>{request.quotesCount} cotización(es)</span>
          <span>{formatDate(request.createdAt)}</span>
        </div>
      </CardContent>
    </Card>
  );

  if (showLink) {
    return <Link to={`/panel/solicitudes/${request.id}`}>{content}</Link>;
  }
  return content;
}
