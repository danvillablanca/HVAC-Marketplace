import { BadgeCheck, ShieldCheck, Star, TrendingUp } from "lucide-react";

const SIGNALS = [
  { icon: TrendingUp, label: "10 años prom.", detail: "Experiencia de los proveedores" },
  { icon: ShieldCheck, label: "Proveedores verificados", detail: "RUT y documentos validados" },
  { icon: Star, label: "4,8/5 en reseñas", detail: "Más de 1.200 evaluaciones" },
  { icon: BadgeCheck, label: "Estándares ASHRAE", detail: "Buenas prácticas de la industria" },
];

export function TrustBar() {
  return (
    <section className="border-y border-border bg-card" aria-label="Señales de confianza">
      <ul className="container-page grid grid-cols-2 gap-6 py-8 sm:gap-8 lg:grid-cols-4">
        {SIGNALS.map(({ icon: Icon, label, detail }) => (
          <li key={label} className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-5" />
            </span>
            <div>
              <p className="font-display text-sm font-semibold sm:text-base">{label}</p>
              <p className="text-xs text-muted-foreground sm:text-sm">{detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
