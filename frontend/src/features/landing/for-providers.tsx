import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, TrendingUp, Users, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const BENEFITS = [
  {
    icon: Users,
    title: "Más clientes",
    description: "Recibe solicitudes reales de tu comuna y radio de cobertura.",
  },
  {
    icon: BadgeCheck,
    title: "Perfil verificado",
    description: "El sello de verificación y las reseñas aumentan tu tasa de cierre.",
  },
  {
    icon: Wallet,
    title: "Comisión solo por trabajo cerrado",
    description: "Sin costos fijos mensuales: pagas únicamente cuando cierras un trabajo.",
  },
];

export function ForProviders() {
  return (
    <section
      id="proveedores"
      className="container-page py-16 sm:py-20"
      aria-labelledby="proveedores-heading"
    >
      <div className="grid items-center gap-10 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-10 lg:grid-cols-2 lg:p-12">
        <div>
          <Badge variant="secondary">Para proveedores HVAC</Badge>
          <h2 id="proveedores-heading" className="mt-4 font-display text-3xl font-bold sm:text-4xl">
            Consigue trabajos de clientes que ya te están buscando.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Únete a la red de proveedores verificados y recibe solicitudes según tu cobertura y
            especialidad, sin invertir en publicidad.
          </p>

          <ul className="mt-6 space-y-4">
            {BENEFITS.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/registro">
                Quiero ser proveedor
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link to="/para-proveedores">Conocer el programa</Link>
            </Button>
          </div>
        </div>

        <ProviderPreview />
      </div>
    </section>
  );
}

function ProviderPreview() {
  return (
    <div className="rounded-2xl border border-border bg-background p-6">
      <div className="flex items-center gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-accent text-lg font-bold text-accent-foreground">
          MF
        </span>
        <div>
          <p className="flex items-center gap-1.5 font-display text-lg font-semibold">
            Maestranza Frío Ltda.
            <BadgeCheck className="size-4 text-primary" />
          </p>
          <p className="text-sm text-muted-foreground">Refrigeración comercial · Concepción</p>
        </div>
      </div>

      <Separator className="my-5" />

      <dl className="grid grid-cols-3 gap-3 text-center">
        <div>
          <dt className="font-display text-xl font-bold text-primary">128</dt>
          <dd className="text-xs text-muted-foreground">trabajos</dd>
        </div>
        <div>
          <dt className="font-display text-xl font-bold text-primary">&lt; 2 h</dt>
          <dd className="text-xs text-muted-foreground">respuesta</dd>
        </div>
        <div>
          <dt className="font-display text-xl font-bold text-primary">4,9</dt>
          <dd className="text-xs text-muted-foreground">rating</dd>
        </div>
      </dl>

      <div className="mt-5 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <TrendingUp className="size-4 text-primary" /> Solicitud nueva · Providencia
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Mantención de chiller, 2 equipos</p>
      </div>
    </div>
  );
}
