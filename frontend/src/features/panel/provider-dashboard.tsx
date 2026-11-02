import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  AlertCircle,
  BadgeCheck,
  Clock,
  FileText,
  Inbox,
  Pencil,
  ShieldCheck,
  Star,
  XCircle,
} from "lucide-react";
import type { ProviderVerificationStatus } from "@hvac/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/features/auth";
import { useServiceRequests } from "@/features/requests/hooks";
import { useUnreadCount } from "@/features/notifications/hooks";
import { useMyProviderProfile } from "./provider-hooks";

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

export function ProviderDashboard() {
  const { user } = useAuth();
  const firstName = user?.fullName?.split(" ")[0] ?? "proveedor";
  const { data: requests } = useServiceRequests();
  const { data: unread = 0 } = useUnreadCount();
  const { data: profile, isLoading: profileLoading } = useMyProviderProfile();
  const status = STATUS_BADGE[profile?.verificationStatus ?? "pendiente"];

  const openRequests =
    requests?.filter((r) => ["abierta", "con_cotizaciones"].includes(r.status)) ?? [];
  const totalRequests = requests?.length ?? 0;

  const metrics = [
    {
      label: "Solicitudes abiertas",
      value: String(openRequests.length),
      hint: "Disponibles para cotizar",
      icon: Inbox,
    },
    {
      label: "Total solicitudes",
      value: String(totalRequests),
      hint: "En la plataforma",
      icon: FileText,
    },
    {
      label: "Notificaciones",
      value: String(unread),
      hint: "Sin leer",
      icon: Star,
    },
  ];

  return (
    <section className="container-page space-y-8 py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Hola, {firstName}</h1>
          <p className="mt-1 text-muted-foreground">
            Resumen de tu actividad y solicitudes disponibles en el marketplace.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/panel/proveedor/perfil">
              <Pencil className="size-4" />
              {profile ? "Editar perfil" : "Completar perfil"}
            </Link>
          </Button>
          <Button asChild>
            <Link to="/panel/proveedor/verificacion">
              <ShieldCheck className="size-4" />
              Verificacion
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

      <div className="grid gap-4 sm:grid-cols-3">
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

      {/* Bandeja de solicitudes */}
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Solicitudes disponibles</CardTitle>
            <CardDescription>
              Revisa y envía cotizaciones a solicitudes de clientes.
            </CardDescription>
          </div>
          <Button asChild>
            <Link to="/panel/proveedor/bandeja">
              <Inbox className="size-4 mr-1" />
              Ir a la bandeja
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {openRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <Inbox className="size-8 text-muted-foreground" />
              <p className="font-medium">No hay solicitudes abiertas</p>
              <p className="text-sm text-muted-foreground">
                Las nuevas solicitudes de clientes aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {openRequests.slice(0, 5).map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between rounded-md border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {req.equipment} — {req.commune ?? "Sin ubicación"}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{req.description}</p>
                  </div>
                  <Badge variant={req.status === "abierta" ? "default" : "warning"}>
                    {req.status === "abierta" ? "Abierta" : `${req.quotesCount} cotiz.`}
                  </Badge>
                </div>
              ))}
              {openRequests.length > 5 && (
                <p className="text-center text-xs text-muted-foreground">
                  y {openRequests.length - 5} más...
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

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
              <Inbox className="size-5 text-primary" />
              Bandeja de cotizaciones
            </CardTitle>
            <CardDescription>Accede a tu bandeja para cotizar solicitudes.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {openRequests.length} solicitudes disponibles
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to="/panel/proveedor/bandeja">Ver bandeja</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
