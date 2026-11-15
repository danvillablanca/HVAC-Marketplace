import { useState } from "react";
import { motion } from "motion/react";
import {
  BadgeDollarSign,
  CheckCircle2,
  Inbox,
  Percent,
  Send,
  Timer,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import {
  CANCEL_REASON_LABELS,
  CANCEL_REASONS,
  RATE_KEYS,
  formatCLP,
  formatDate,
  formatDuration,
  type CancelReason,
  type DateRange,
  type MetricKey,
  type ProviderMetricsSnapshot,
} from "@hvac/shared";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useProviderMetrics } from "./provider-hooks";

// ---------------------------------------------------------------------------
// Rango de fechas (compartido con el panel del administrador)
// ---------------------------------------------------------------------------

export type RangePreset = "este_mes" | "mes_anterior" | "ultimos_30" | "personalizado";

const PRESET_LABELS: Record<RangePreset, string> = {
  este_mes: "Este mes",
  mes_anterior: "Mes anterior",
  ultimos_30: "Últimos 30 días",
  personalizado: "Personalizado",
};

/** Fecha local en aaaa-mm-dd (los inputs de fecha trabajan en hora local). */
function localIso(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function presetRange(preset: Exclude<RangePreset, "personalizado">, today = new Date()) {
  const y = today.getFullYear();
  const m = today.getMonth();
  if (preset === "mes_anterior") {
    return { from: localIso(new Date(y, m - 1, 1)), to: localIso(new Date(y, m, 0)) };
  }
  if (preset === "ultimos_30") {
    return { from: localIso(new Date(y, m, today.getDate() - 29)), to: localIso(today) };
  }
  return { from: localIso(new Date(y, m, 1)), to: localIso(today) };
}

export function useDateRange() {
  const [preset, setPreset] = useState<RangePreset>("este_mes");
  const [custom, setCustom] = useState<DateRange>(() => presetRange("este_mes"));
  const range = preset === "personalizado" ? custom : presetRange(preset);
  const valid = Boolean(range.from && range.to && range.from <= range.to);
  return { preset, setPreset, custom, setCustom, range, valid };
}

export function DateRangePicker({
  idPrefix,
  state,
}: {
  idPrefix: string;
  state: ReturnType<typeof useDateRange>;
}) {
  const { preset, setPreset, custom, setCustom, valid } = state;
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-preset`}>Período</Label>
        <Select
          id={`${idPrefix}-preset`}
          value={preset}
          onChange={(e) => setPreset(e.target.value as RangePreset)}
        >
          {(Object.keys(PRESET_LABELS) as RangePreset[]).map((p) => (
            <option key={p} value={p}>
              {PRESET_LABELS[p]}
            </option>
          ))}
        </Select>
      </div>
      {preset === "personalizado" && (
        <>
          <div className="space-y-1">
            <Label htmlFor={`${idPrefix}-from`}>Desde</Label>
            <Input
              id={`${idPrefix}-from`}
              type="date"
              value={custom.from}
              max={custom.to || undefined}
              onChange={(e) => setCustom({ ...custom, from: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${idPrefix}-to`}>Hasta</Label>
            <Input
              id={`${idPrefix}-to`}
              type="date"
              value={custom.to}
              min={custom.from || undefined}
              onChange={(e) => setCustom({ ...custom, to: e.target.value })}
            />
          </div>
          {!valid && (
            <p className="w-full text-sm text-destructive">
              La fecha inicial debe ser anterior a la final.
            </p>
          )}
        </>
      )}
    </div>
  );
}

/** "01-11-2026 al 13-11-2026" (fechas dd-mm-aaaa). */
export function rangeLabel(range: DateRange): string {
  const fmt = (v: string) => formatDate(`${v}T12:00:00`);
  return `${fmt(range.from)} al ${fmt(range.to)}`;
}

// ---------------------------------------------------------------------------
// Barras de motivos de cancelación (sin librería de gráficos)
// ---------------------------------------------------------------------------

export function CancelReasonBars({ reasons }: { reasons: Record<CancelReason, number> }) {
  const total = CANCEL_REASONS.reduce((sum, r) => sum + reasons[r], 0);
  if (total === 0) {
    return <p className="py-2 text-sm text-muted-foreground">Sin cancelaciones en este período.</p>;
  }
  return (
    <ul className="space-y-3" aria-label="Motivos de cancelación">
      {CANCEL_REASONS.map((r) => {
        const pct = Math.round((reasons[r] / total) * 100);
        return (
          <li key={r} className="space-y-1" data-testid={`cancel-reason-${r}`}>
            <div className="flex justify-between text-sm">
              <span>{CANCEL_REASON_LABELS[r]}</span>
              <span className="tabular-nums text-muted-foreground">
                {reasons[r]} ({pct}%)
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Métricas comerciales del proveedor
// ---------------------------------------------------------------------------

const KPIS: Array<{ key: MetricKey; label: string; hint: string; icon: LucideIcon }> = [
  { key: "received", label: "Solicitudes recibidas", hint: "Llegaron a tu bandeja", icon: Inbox },
  { key: "quoted", label: "Cotizaciones enviadas", hint: "Solicitudes que cotizaste", icon: Send },
  {
    key: "accepted",
    label: "Cotizaciones aceptadas",
    hint: "El cliente te eligió",
    icon: CheckCircle2,
  },
  {
    key: "quoteRate",
    label: "Tasa de cotización",
    hint: "Recibidas que cotizaste",
    icon: Percent,
  },
  {
    key: "acceptanceRate",
    label: "Tasa de aceptación",
    hint: "Cotizadas que ganaste",
    icon: TrendingUp,
  },
  {
    key: "avgFirstResponseSeconds",
    label: "Tiempo de primera respuesta",
    hint: "Promedio hasta tu cotización",
    icon: Timer,
  },
  {
    key: "acceptedAmount",
    label: "Monto aceptado",
    hint: "Total de cotizaciones ganadas",
    icon: BadgeDollarSign,
  },
];

function formatMetric(key: MetricKey, s: ProviderMetricsSnapshot): string {
  const v = s[key];
  if (key === "acceptedAmount") return formatCLP(v ?? 0);
  if (key === "avgFirstResponseSeconds") return formatDuration(v);
  if (RATE_KEYS.includes(key)) return v === null ? "—" : `${Math.round(v * 100)}%`;
  return String(v ?? 0);
}

function DeltaBadge({ metric, delta }: { metric: MetricKey; delta: number | null }) {
  if (delta === null) {
    return <Badge variant="secondary">Sin datos previos</Badge>;
  }
  const unit = RATE_KEYS.includes(metric) ? " pp" : "%";
  const text = `${delta > 0 ? "+" : ""}${delta.toLocaleString("es-CL")}${unit}`;
  if (delta === 0) return <Badge variant="secondary">{text}</Badge>;
  // Bajar el tiempo de respuesta es bueno.
  const good = metric === "avgFirstResponseSeconds" ? delta < 0 : delta > 0;
  return <Badge variant={good ? "success" : "destructive"}>{text}</Badge>;
}

export function ProviderMetrics() {
  const rangeState = useDateRange();
  const { range, valid } = rangeState;
  const { data, isLoading, error } = useProviderMetrics(range);
  const ready = valid && data;

  return (
    <section className="space-y-4" aria-labelledby="provider-metrics-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="provider-metrics-title" className="font-display text-xl font-semibold">
            Métricas comerciales
          </h2>
          <p className="text-sm text-muted-foreground">
            {ready
              ? `${rangeLabel(data.range)} · comparado con ${rangeLabel(data.previousRange)}`
              : "Cómo te va con las solicitudes que recibes."}
          </p>
        </div>
        <DateRangePicker idPrefix="metrics" state={rangeState} />
      </div>

      {error && (
        <p className="text-sm text-destructive">
          No pudimos cargar tus métricas. Intenta de nuevo.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((kpi, index) => (
          <motion.div
            key={kpi.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.04 }}
          >
            <Card className="h-full" data-testid={`metric-${kpi.key}`}>
              <CardContent className="flex h-full items-start justify-between gap-3 p-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  {isLoading || !ready ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <>
                      <p className="font-display text-2xl font-bold">
                        {formatMetric(kpi.key, data.current)}
                      </p>
                      <DeltaBadge metric={kpi.key} delta={data.deltas[kpi.key]} />
                    </>
                  )}
                  <p className="text-xs text-muted-foreground">{kpi.hint}</p>
                </div>
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <kpi.icon className="size-5" />
                </span>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Motivos de cancelación</CardTitle>
          <CardDescription>
            Solicitudes que recibiste y que el cliente canceló en el período.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading || !ready ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <CancelReasonBars reasons={data.current.cancelReasons} />
          )}
        </CardContent>
      </Card>
    </section>
  );
}
