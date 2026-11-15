import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCancellationMetrics } from "@/features/admin/hooks";
import { CancelReasonBars, DateRangePicker, rangeLabel, useDateRange } from "./provider-metrics";

/** Motivos de cancelación de toda la plataforma (solicitud de cambio, 13/11/2026). */
export function AdminCancellationMetrics() {
  const rangeState = useDateRange();
  const { range, valid } = rangeState;
  const { data, isLoading, error } = useCancellationMetrics(range);

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-end justify-between gap-3 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Motivos de cancelación</CardTitle>
          <CardDescription>
            {valid && data
              ? `${data.total} solicitudes canceladas · ${rangeLabel(data.range)}`
              : "Por qué los clientes cancelan sus solicitudes."}
          </CardDescription>
        </div>
        <DateRangePicker idPrefix="admin-cancel" state={rangeState} />
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-sm text-destructive">No pudimos cargar las métricas.</p>
        ) : isLoading || !valid || !data ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <CancelReasonBars reasons={data.reasons} />
        )}
      </CardContent>
    </Card>
  );
}
