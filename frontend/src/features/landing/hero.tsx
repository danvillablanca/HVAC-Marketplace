import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, BadgeCheck, MapPin, Search, ShieldCheck, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PINS = [
  { top: "20%", left: "16%", delay: 0 },
  { top: "42%", left: "64%", delay: 0.5 },
  { top: "64%", left: "36%", delay: 1 },
];

const HERO_SIGNALS = [
  { icon: ShieldCheck, label: "Perfiles verificados", className: "text-success" },
  { icon: Star, label: "4,8/5 en reseñas", className: "text-warning" },
  { icon: MapPin, label: "Cobertura nacional", className: "text-primary" },
];

export function Hero() {
  const reduce = useReducedMotion();
  const hidden = { opacity: 0, y: 20 };
  const visible = { opacity: 1, y: 0 };
  const enter = (delay: number) => ({
    initial: reduce ? visible : hidden,
    animate: visible,
    transition: { duration: 0.5, delay: reduce ? 0 : delay },
  });

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute -top-24 right-[-10%] size-[30rem] rounded-full bg-accent/25 blur-3xl" />
        <div className="absolute top-1/2 left-[-12%] size-96 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="container-page grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-2 lg:py-28">
        <div>
          <motion.div {...enter(0)}>
            <Badge className="gap-1.5 py-1 pr-3 pl-1.5">
              <span className="grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                <BadgeCheck className="size-3.5" />
              </span>
              Respaldado por ASHRAE
            </Badge>
          </motion.div>

          <motion.h1
            {...enter(0.08)}
            className="mt-6 font-display text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Encuentra y contrata proveedores HVAC <span className="text-gradient">verificados</span>{" "}
            en Chile.
          </motion.h1>

          <motion.p
            {...enter(0.16)}
            className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg"
          >
            Publica tu requerimiento, recibe y compara cotizaciones de proveedores verificados y
            revisa sus reseñas directamente en el mapa. Todo en un solo lugar, con estándares
            ASHRAE.
          </motion.p>

          <motion.div {...enter(0.24)} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/mapa">
                Publicar requerimiento gratis
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/buscar">
                <Search className="size-4" />
                Ver proveedores cerca
              </Link>
            </Button>
          </motion.div>

          <motion.ul
            {...enter(0.32)}
            className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground"
          >
            {HERO_SIGNALS.map(({ icon: Icon, label, className }) => (
              <li key={label} className="flex items-center gap-1.5">
                <Icon className={`size-4 ${className}`} />
                {label}
              </li>
            ))}
          </motion.ul>
        </div>

        <HeroVisual reduce={reduce} />
      </div>
    </section>
  );
}

function HeroVisual({ reduce }: { reduce: boolean | null }) {
  return (
    <motion.div
      initial={reduce ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: reduce ? 0 : 0.2 }}
      className="relative mx-auto w-full max-w-lg"
    >
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-secondary/40 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4 text-primary" /> Santiago, RM
          </div>
          <Badge variant="success" className="gap-1">
            <ShieldCheck className="size-3.5" /> Verificados
          </Badge>
        </div>

        <div className="relative h-64 sm:h-72">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/40 via-background to-accent/10" />
          <svg className="absolute inset-0 size-full text-border/80" aria-hidden>
            <defs>
              <pattern id="hero-map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M40 0H0V40" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-map-grid)" />
          </svg>
          <svg
            className="absolute inset-0 size-full text-primary/50"
            viewBox="0 0 400 300"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              d="M70 60 C150 110 210 80 250 140 S320 210 350 230"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="6 7"
            />
          </svg>

          {PINS.map((pin) => (
            <span
              key={`${pin.top}-${pin.left}`}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ top: pin.top, left: pin.left }}
            >
              {!reduce && (
                <motion.span
                  className="absolute inset-0 -m-1 rounded-full bg-primary/40"
                  animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, delay: pin.delay }}
                />
              )}
              <span className="relative grid size-4 place-items-center rounded-full border-2 border-card bg-primary shadow" />
            </span>
          ))}

          <div className="absolute right-3 bottom-3 left-3 flex items-center gap-3 rounded-xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
              RC
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Refricentral SpA</p>
              <p className="truncate text-xs text-muted-foreground">Climatización · Providencia</p>
            </div>
            <span className="flex items-center gap-1 text-sm font-semibold">
              <Star className="size-4 fill-warning text-warning" /> 4,9
            </span>
          </div>
        </div>
      </div>

      <div className="absolute -top-4 -right-2 hidden items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium shadow-lg sm:flex">
        <Search className="size-3.5 text-primary" /> 3 cotizaciones nuevas
      </div>
      <div className="absolute -bottom-4 -left-2 hidden items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium shadow-lg sm:flex">
        <ShieldCheck className="size-3.5 text-success" /> Documentos validados
      </div>
    </motion.div>
  );
}
