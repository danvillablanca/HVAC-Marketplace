import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  BadgeCheck,
  Eye,
  MessageSquare,
  Pencil,
  Phone,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { formatCLP, formatDate, type LeadStatus } from "@hvac/shared";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/features/auth";

interface Metric {
  label: string;
  value: string;
  hint: string;
  icon: typeof Eye;
}

const METRICS: Metric[] = [
  { label: "Visitas al perfil", value: "1.248", hint: "+12% vs mes anterior", icon: Eye },
  { label: "Contactos", value: "86", hint: "+8% vs mes anterior", icon: Phone },
  { label: "Rating promedio", value: "4,8", hint: "132 resenas verificadas", icon: Star },
  { label: "Resenas", value: "132", hint: "+5 este mes", icon: MessageSquare },
];

interface DemoLead {
  id: string;
  client: string;
  service: string;
  amount: number | null;
  status: LeadStatus;
  createdAt: string;
}

const LEADS: DemoLead[] = [
  {
    id: "L-2041",
    client: "Constructora Andes",
    service: "Ventilacion industrial y comercial",
    amount: 1850000,
    status: "nuevo",
    createdAt: "2026-09-22T10:30:00.000Z",
  },
  {
    id: "L-2038",
    client: "Clinica Los Robles",
    service: "Salas limpias y laboratorios",
    amount: 4200000,
    status: "contactado",
    createdAt: "2026-09-20T14:05:00.000Z",
  },
  {
    id: "L-2032",
    client: "Familia Perez",
    service: "Venta e instalacion de equipos Split",
    amount: 289990,
    status: "cotizado",
    createdAt: "2026-09-18T09:15:00.000Z",
  },
  {
    id: "L-2019",
    client: "Retail Plaza Norte",
    service: "Montaje y mantenimiento",
    amount: 640000,
    status: "cerrado",
    createdAt: "2026-09-11T16:40:00.000Z",
  },
  {
    id: "L-2007",
    client: "Oficinas Central Park",
    service: "Inspeccion tecnica HVAC",
    amount: null,
    status: "perdido",
    createdAt: "2026-09-04T12:00:00.000Z",
  },
];

const STATUS_LABEL: Record<LeadStatus, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  cotizado: "Cotizado",
  cerrado: "Cerrado",
  perdido: "Perdido",
};

const STATUS_VARIANT: Record<LeadStatus, BadgeProps["variant"]> = {
  nuevo: "default",
  contactado: "secondary",
  cotizado: "warning",
  cerrado: "success",
  perdido: "destructive",
};

export function ProviderDashboard() {
  const { user } = useAuth();
  const firstName = user?.fullName?.split(" ")[0] ?? "proveedor";

  return (
    <section className="container-page space-y-8 py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Hola, {firstName}</h1>
          <p className="mt-1 text-muted-foreground">
            Resumen de tu actividad y solicitudes recientes en el marketplace.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/para-proveedores">
              <Pencil className="size-4" />
              Editar perfil
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map((metric, index) => (
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

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Solicitudes recientes</CardTitle>
            <CardDescription>Leads y contactos de los ultimos 30 dias.</CardDescription>
          </div>
          <Badge variant="outline" className="w-fit">
            <Users className="size-3" /> {LEADS.length} activos
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <caption className="sr-only">Solicitudes recientes del proveedor</caption>
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Cliente
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Servicio
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Monto estimado
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Fecha
                  </th>
                  <th scope="col" className="py-2 font-medium">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {LEADS.map((lead) => (
                  <tr key={lead.id} className="border-b border-border/60 last:border-0">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-foreground">{lead.client}</p>
                      <p className="text-xs text-muted-foreground">{lead.id}</p>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{lead.service}</td>
                    <td className="py-3 pr-4">{formatCLP(lead.amount)}</td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="py-3">
                      <Badge variant={STATUS_VARIANT[lead.status]}>
                        {STATUS_LABEL[lead.status]}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" />
              Estado de verificacion
            </CardTitle>
            <CardDescription>Tu perfil esta visible con el sello ASHRAE.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <Badge variant="success">
              <BadgeCheck className="size-3" /> Verificado
            </Badge>
            <Button asChild variant="outline" size="sm">
              <Link to="/panel/proveedor/verificacion">Revisar antecedentes</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="size-5 text-warning" />
              Reputacion
            </CardTitle>
            <CardDescription>Responde rapido para mantener tu posicion.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Tiempo de respuesta promedio: <span className="font-medium text-foreground">3 h</span>
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to="/panel/proveedor/verificacion">Mejorar perfil</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
