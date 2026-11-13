import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  AlertCircle,
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  Circle,
  Clock,
  Eye,
  Inbox,
  MapPin,
  Pencil,
  Send,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import type { ProviderProfile, ProviderVerificationStatus } from "@hvac/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/features/auth";
import { useServiceRequests } from "@/features/requests/hooks";
import { useMyProviderProfile } from "./provider-hooks";
import { ProviderMetrics } from "./provider-metrics";

const STATUS_BADGE: Record<
  ProviderVerificationStatus,
  {
    label: string;
    variant: "success" | "warning" | "destructive" | "secondary";
    icon: typeof BadgeCheck;
    hint: string;
  }
> = {
  verificado: {
    label: "Verificado",
    variant: "success",
    icon: BadgeCheck,
    hint: "Apareces en las búsquedas y puedes cotizar.",
  },
  en_revision: {
    label: "En revisión",
    variant: "warning",
    icon: Clock,
    hint: "El equipo ASHRAE está revisando tus antecedentes.",
  },
  pendiente: {
    label: "Sin verificar",
    variant: "secondary",
    icon: AlertCircle,
    hint: "Envía tus antecedentes para aparecer en las búsquedas.",
  },
  rechazado: {
    label: "Rechazado",
    variant: "destructive",
    icon: XCircle,
    hint: "Revisa el motivo, corrige tu perfil y vuelve a enviarlo.",
  },
};

const NEXT_STEP: Record<string, string> = {
  aceptada: "Siguiente paso: marcar en ejecución",
  en_ejecucion: "Siguiente paso: marcar como completada",
  completada: "Esperando confirmación del cliente",
};

/** Panel del proveedor: su bandeja, sus cotizaciones y sus trabajos (no el panel del cliente). */
export function ProviderDashboard() {
  const { user } = useAuth();
  const { data: requests } = useServiceRequests();
  const { data: profile, isLoading: profileLoading } = useMyProviderProfile();
  const status = STATUS_BADGE[profile?.verificationStatus ?? "pendiente"];
  const name = profile?.legalName ?? user?.fullName ?? "tu empresa";

  // Mismos grupos que la bandeja (ProviderInboxPage).
  const all = requests ?? [];
  const toQuote = all.filter(
    (r) =>
      ["abierta", "con_cotizaciones"].includes(r.status) &&
      r.myQuoteStatus !== "enviada" &&
      r.myQuoteStatus !== "aceptada",
  );
  const quoted = all.filter((r) => r.myQuoteStatus === "enviada");
  const jobs = all.filter((r) => r.myQuoteStatus === "aceptada");
  const active = jobs.filter((r) => r.status !== "completada" || !r.clientConfirmedAt);
  const done = jobs.filter((r) => r.status === "completada");

  const metrics = [
    {
      label: "Por cotizar",
      value: toQuote.length,
      hint: "Solicitudes en tu cobertura",
      icon: Inbox,
    },
    {
      label: "Cotizaciones enviadas",
      value: quoted.length,
      hint: "Esperando respuesta",
      icon: Send,
    },
    {
      label: "Trabajos en curso",
      value: active.length,
      hint: "Adjudicados a tu empresa",
      icon: Briefcase,
    },
    { label: "Completados", value: done.length, hint: "Trabajos terminados", icon: CheckCircle2 },
  ];

  return (
    <section className="container-page space-y-8 py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Panel de proveedor</p>
          <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold sm:text-3xl">
            {name}
            {/* Sin badge mientras carga: evita mostrar "Sin verificar" por un instante. */}
            {!profileLoading && (
              <Badge variant={status.variant}>
                <status.icon className="size-3" /> {status.label}
              </Badge>
            )}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/panel/proveedor/bandeja">
              <Inbox className="size-4" />
              Ir a la bandeja
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/panel/proveedor/perfil">
              <Pencil className="size-4" />
              {profile ? "Editar perfil" : "Completar perfil"}
            </Link>
          </Button>
        </div>
      </header>

      {!profileLoading && !profile && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">Completa el perfil de tu empresa</p>
              <p className="text-sm text-muted-foreground">
                Agrega tus servicios, comuna y radio de cobertura para poder verificarte y recibir
                solicitudes.
              </p>
            </div>
            <Button asChild>
              <Link to="/panel/proveedor/perfil">Completar perfil</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!profileLoading && profile !== undefined && <SearchVisibility profile={profile} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.05 }}
          >
            <Card>
              <CardContent className="flex items-start justify-between gap-3 p-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="font-display text-2xl font-bold">{metric.value}</p>
                  <p className="text-xs text-muted-foreground">{metric.hint}</p>
                </div>
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <metric.icon className="size-5" />
                </span>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {profile && <ProviderMetrics />}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Solicitudes nuevas para cotizar</CardTitle>
            <CardDescription>Clientes de tu zona esperando cotización.</CardDescription>
          </CardHeader>
          <CardContent>
            {toQuote.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                No hay solicitudes nuevas. Te avisaremos cuando llegue una.
              </p>
            ) : (
              <ul className="space-y-2">
                {toQuote.slice(0, 5).map((req) => (
                  <li key={req.id} className="rounded-md border border-border p-3">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      {req.serviceName ?? req.equipment} — {req.commune ?? "Sin ubicación"}
                      {req.isDirect && <Badge>Directa a tu empresa</Badge>}
                    </p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {req.description}
                      {req.distanceKm != null && ` · ~${req.distanceKm} km`}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link to="/panel/proveedor/bandeja">Cotizar en la bandeja</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trabajos en curso</CardTitle>
            <CardDescription>Solicitudes donde el cliente aceptó tu cotización.</CardDescription>
          </CardHeader>
          <CardContent>
            {active.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                Cuando un cliente acepte tu cotización, el trabajo aparecerá aquí.
              </p>
            ) : (
              <ul className="space-y-2">
                {active.slice(0, 5).map((req) => (
                  <li key={req.id}>
                    <Link
                      to={`/panel/solicitudes/${req.id}`}
                      className="block rounded-md border border-border p-3 transition-colors hover:bg-muted/50"
                    >
                      <p className="text-sm font-medium">
                        {req.serviceName ?? req.equipment} — {req.commune ?? "Sin ubicación"}
                      </p>
                      <p className="text-xs text-primary">{NEXT_STEP[req.status] ?? req.status}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" />
              Estado de verificacion
            </CardTitle>
            <CardDescription>{status.hint}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <Badge variant={status.variant}>
                <status.icon className="size-3" /> {status.label}
              </Badge>
              <Button asChild variant="outline" size="sm">
                <Link to="/panel/proveedor/verificacion">
                  {profile?.verificationStatus === "verificado"
                    ? "Ver antecedentes"
                    : "Verificarme"}
                </Link>
              </Button>
            </div>
            {profile?.verificationStatus === "rechazado" && profile.verificationNote && (
              <p className="text-sm text-destructive">Motivo: {profile.verificationNote}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="size-5 text-primary" />
              Cobertura y disponibilidad
            </CardTitle>
            <CardDescription>
              {profile
                ? `${profile.services.length} servicios · hasta ${profile.coverageRadiusKm} km desde ${profile.commune}`
                : "Define tus servicios y tu zona de atención."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <Badge variant={profile?.isAvailable ? "success" : "secondary"}>
              {profile?.isAvailable ? "Disponible para nuevos trabajos" : "No disponible"}
            </Badge>
            <Button asChild variant="outline" size="sm">
              <Link to="/panel/proveedor/perfil">Editar</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

/** Explica al proveedor si aparece en la busqueda y que le falta (VER-03, PRO-03, PRO-06). */
function SearchVisibility({ profile }: { profile: ProviderProfile | null }) {
  const status = profile?.verificationStatus;
  const checks = [
    {
      ok: Boolean(profile),
      label: "Perfil completo con servicios y comuna",
      action: !profile ? { to: "/panel/proveedor/perfil", label: "Completar perfil" } : null,
    },
    {
      ok: status === "verificado",
      label:
        status === "en_revision"
          ? "Verificación en revisión por el equipo ASHRAE"
          : status === "rechazado"
            ? "Verificación rechazada: corrige y vuelve a enviar"
            : "Empresa verificada",
      action:
        profile && (status === "pendiente" || status === "rechazado")
          ? { to: "/panel/proveedor/verificacion", label: "Enviar a verificación" }
          : null,
    },
    {
      ok: Boolean(profile?.isAvailable),
      label: "Marcada como disponible",
      action:
        profile && !profile.isAvailable
          ? { to: "/panel/proveedor/perfil", label: "Cambiar disponibilidad" }
          : null,
    },
  ];
  const visible = checks.every((c) => c.ok);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="size-5 text-primary" />
          {visible ? "Tu empresa aparece en la búsqueda" : "¿Por qué no apareces en la búsqueda?"}
        </CardTitle>
        <CardDescription>
          Solo se muestran empresas verificadas, y a clientes que estén dentro de tu radio de
          cobertura
          {profile ? ` (${profile.coverageRadiusKm} km desde ${profile.commune})` : ""}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {checks.map((check) => (
            <li key={check.label} className="flex flex-wrap items-center gap-2 text-sm">
              {check.ok ? (
                <CheckCircle2 className="size-4 text-success" />
              ) : (
                <Circle className="size-4 text-muted-foreground" />
              )}
              <span className={check.ok ? "" : "text-muted-foreground"}>{check.label}</span>
              {check.action && (
                <Link to={check.action.to} className="font-medium text-primary hover:underline">
                  {check.action.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
