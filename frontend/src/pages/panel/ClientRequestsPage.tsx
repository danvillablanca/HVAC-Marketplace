import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { CalendarClock, Search } from "lucide-react";
import { formatCLP, formatDate, type LeadStatus } from "@hvac/shared";
import { RequireRole, useAuth } from "@/features/auth";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DemoClientRequest {
  id: string;
  provider: string;
  service: string;
  amount: number | null;
  status: LeadStatus;
  createdAt: string;
}

const REQUESTS: DemoClientRequest[] = [
  {
    id: "S-1042",
    provider: "Hogar Fresco Instalaciones",
    service: "Venta e instalacion de equipos Split",
    amount: 289990,
    status: "cotizado",
    createdAt: "2026-09-19T10:00:00.000Z",
  },
  {
    id: "S-1036",
    provider: "Clima Andes SpA",
    service: "Ventilacion industrial y comercial",
    amount: 1850000,
    status: "contactado",
    createdAt: "2026-09-15T13:30:00.000Z",
  },
  {
    id: "S-1021",
    provider: "Valpo Clima Servicios",
    service: "Reparacion y carga de gas",
    amount: 45000,
    status: "cerrado",
    createdAt: "2026-09-02T09:45:00.000Z",
  },
  {
    id: "S-1008",
    provider: "Solar Verde Energia",
    service: "Energia solar",
    amount: null,
    status: "nuevo",
    createdAt: "2026-08-28T17:20:00.000Z",
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

function ClientRequestsContent() {
  const { user } = useAuth();
  const firstName = user?.fullName?.split(" ")[0] ?? "cliente";

  return (
    <section className="container-page space-y-8 py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Hola, {firstName}</h1>
          <p className="mt-1 text-muted-foreground">
            Revisa el estado de tus solicitudes de servicio HVAC.
          </p>
        </div>
        <Button asChild>
          <Link to="/buscar">
            <Search className="size-4" />
            Buscar proveedores
          </Link>
        </Button>
      </header>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Mis solicitudes</CardTitle>
            <CardDescription>Seguimiento de tus requerimientos y cotizaciones.</CardDescription>
          </div>
          <Badge variant="outline" className="w-fit">
            <CalendarClock className="size-3" /> {REQUESTS.length} en total
          </Badge>
        </CardHeader>
        <CardContent>
          {REQUESTS.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <Search className="size-8 text-muted-foreground" />
              <p className="font-medium">Aun no tienes solicitudes</p>
              <Button asChild className="mt-2" size="sm">
                <Link to="/buscar">Explorar proveedores</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-sm">
                <caption className="sr-only">Solicitudes del cliente</caption>
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th scope="col" className="py-2 pr-4 font-medium">
                      Proveedor
                    </th>
                    <th scope="col" className="py-2 pr-4 font-medium">
                      Servicio
                    </th>
                    <th scope="col" className="py-2 pr-4 font-medium">
                      Monto
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
                  {REQUESTS.map((request, index) => (
                    <motion.tr
                      key={request.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      className="border-b border-border/60 last:border-0"
                    >
                      <td className="py-3 pr-4">
                        <p className="font-medium text-foreground">{request.provider}</p>
                        <p className="text-xs text-muted-foreground">{request.id}</p>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{request.service}</td>
                      <td className="py-3 pr-4">{formatCLP(request.amount)}</td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {formatDate(request.createdAt)}
                      </td>
                      <td className="py-3">
                        <Badge variant={STATUS_VARIANT[request.status]}>
                          {STATUS_LABEL[request.status]}
                        </Badge>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

export default function ClientRequestsPage() {
  return (
    <RequireRole roles={["cliente"]}>
      <ClientRequestsContent />
    </RequireRole>
  );
}
