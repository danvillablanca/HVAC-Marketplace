import { BarChart3, Map, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const PROPS = [
  {
    icon: ShieldCheck,
    title: "Verificación real",
    description:
      "Revisamos RUT, certificaciones y documentos técnicos de cada proveedor antes de publicarlo. Sin perfiles fantasma ni sorpresas.",
  },
  {
    icon: Map,
    title: "Todo en un mapa",
    description:
      "Filtra por comuna, radio y segmento para ver quién puede atender tu proyecto ahora mismo, cerca de tu ubicación.",
  },
  {
    icon: BarChart3,
    title: "Decide con datos",
    description:
      "Compara reseñas verificadas, tiempos de respuesta y especialidades técnicas para elegir con confianza, no por intuición.",
  },
];

export function ValueProps() {
  return (
    <section className="container-page py-16 sm:py-20" aria-labelledby="valor-heading">
      <div className="mx-auto max-w-2xl text-center">
        <h2 id="valor-heading" className="font-display text-3xl font-bold sm:text-4xl">
          Menos incertidumbre, mejores instalaciones
        </h2>
        <p className="mt-4 text-muted-foreground">
          Reunimos verificación, geolocalización y reputación para que contratar un servicio HVAC
          sea simple y seguro.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {PROPS.map(({ icon: Icon, title, description }) => (
          <Card
            key={title}
            className="h-full transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
          >
            <CardHeader>
              <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <CardTitle className="pt-3">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
