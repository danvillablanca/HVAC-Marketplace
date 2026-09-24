import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const TESTIMONIALS = [
  {
    name: "Camila Rojas",
    initials: "CR",
    comuna: "Ñuñoa, RM",
    quote:
      "Publiqué el requerimiento un lunes y el mismo día tenía tres cotizaciones de proveedores verificados. Instalaron el split en dos días.",
  },
  {
    name: "Rodrigo Fuentes",
    initials: "RF",
    comuna: "Concepción, Biobío",
    quote:
      "Para refrigeración comercial necesitaba respaldo técnico real. El sello de verificación y las reseñas me dieron la confianza que no encontraba en otros lados.",
  },
  {
    name: "Valentina Soto",
    initials: "VS",
    comuna: "Antofagasta",
    quote:
      "El mapa me mostró qué proveedores cubrían nuestra faena. Comparar tiempos de respuesta y especialidades ahorró semanas de cotizaciones.",
  },
];

const SECTORS = [
  "Refrigeración comercial",
  "Climatización industrial",
  "HVAC residencial",
  "Data centers",
  "Minería",
  "Retail",
  "Salud",
  "Educación",
];

export function SocialProof() {
  return (
    <section className="container-page py-16 sm:py-20" aria-labelledby="testimonios-heading">
      <div className="mx-auto max-w-2xl text-center">
        <h2 id="testimonios-heading" className="font-display text-3xl font-bold sm:text-4xl">
          Clientes y proveedores que ya lo usan
        </h2>
        <p className="mt-4 text-muted-foreground">
          Experiencias reales de empresas y hogares en distintas regiones de Chile.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {TESTIMONIALS.map((testimonial) => (
          <figure
            key={testimonial.name}
            className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="flex gap-0.5" aria-label="5 de 5 estrellas">
              {Array.from({ length: 5 }, (_, index) => (
                <Star key={index} className="size-4 fill-warning text-warning" />
              ))}
            </div>
            <blockquote className="mt-4 flex-1 text-sm text-muted-foreground">
              “{testimonial.quote}”
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {testimonial.initials}
              </span>
              <span>
                <span className="block text-sm font-semibold">{testimonial.name}</span>
                <span className="block text-xs text-muted-foreground">{testimonial.comuna}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="mt-12">
        <p className="text-center text-sm font-medium text-muted-foreground">
          Sectores y equipos que cubrimos
        </p>
        <ul className="mt-4 flex flex-wrap justify-center gap-2">
          {SECTORS.map((sector) => (
            <li key={sector}>
              <Badge variant="outline">{sector}</Badge>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
