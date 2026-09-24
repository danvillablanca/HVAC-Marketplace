import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ClipboardList,
  FileText,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ForProviders, Faq, FinalCta, type FaqItem } from "@/features/landing";

const BENEFITS = [
  {
    icon: Users,
    title: "Más clientes cerca",
    description:
      "Recibe solicitudes de tu comuna y radio de cobertura, con el detalle técnico desde el inicio.",
  },
  {
    icon: TrendingUp,
    title: "Más visibilidad",
    description: "Aparece en el mapa y en las búsquedas filtradas por especialidad y segmento.",
  },
  {
    icon: BadgeCheck,
    title: "Perfil verificado",
    description: "El sello de verificación y las reseñas reales aumentan tu tasa de cierre.",
  },
  {
    icon: Wallet,
    title: "Sin costos fijos",
    description: "Sin mensualidades ni cargos por postular. Pagas solo cuando ganas el trabajo.",
  },
];

const STEPS = [
  {
    icon: ClipboardList,
    title: "Crea tu cuenta",
    description: "Regístrate con los datos de tu empresa y define tu cobertura y especialidades.",
  },
  {
    icon: FileText,
    title: "Completa tu perfil",
    description: "Sube RUT, documentación legal y certificaciones técnicas del rubro.",
  },
  {
    icon: ShieldCheck,
    title: "Verificamos",
    description: "Revisamos tus antecedentes y habilitamos tu perfil con el sello verificado.",
  },
  {
    icon: Users,
    title: "Recibe solicitudes",
    description: "Postula a requerimientos cercanos, envía cotizaciones y coordina con el cliente.",
  },
];

const PROVIDER_FAQ: readonly FaqItem[] = [
  {
    question: "¿Cuánto cuesta ser proveedor?",
    answer:
      "Crear el perfil y postular a solicitudes es gratis. Solo pagas una comisión cuando cierras un trabajo a través de la plataforma.",
  },
  {
    question: "¿Qué documentos necesito para verificarme?",
    answer:
      "RUT de la empresa, cédula del representante legal, documentación tributaria vigente y certificaciones técnicas del rubro HVAC.",
  },
  {
    question: "¿Cuánto tarda la verificación?",
    answer:
      "Nuestro equipo revisa los antecedentes y habilita el perfil verificado en hasta 48 horas hábiles.",
  },
  {
    question: "¿Puedo elegir qué solicitudes atender?",
    answer:
      "Sí. Defines tus especialidades, cobertura y capacidad; tú decides a qué requerimientos postular.",
  },
  {
    question: "¿Cómo se calcula la comisión?",
    answer:
      "Se calcula sobre el monto del trabajo cerrado y se informa antes de aceptarlo. No hay cobros por postular ni por figurar en el mapa.",
  },
];

const INCLUDED = [
  "Perfil público verificado en el mapa",
  "Solicitudes ilimitadas según tu cobertura",
  "Mensajería y cotizaciones dentro de la plataforma",
  "Reseñas verificadas de tus clientes",
];

function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, delay: reduce ? 0 : delay }}
    >
      {children}
    </motion.div>
  );
}

export default function ForProvidersPage() {
  return (
    <div className="flex flex-col">
      <section className="container-page py-14 text-center sm:py-20">
        <Badge variant="secondary" className="mx-auto">
          Programa para proveedores
        </Badge>
        <h1 className="mx-auto mt-4 max-w-3xl font-display text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl">
          Crece con clientes que ya están{" "}
          <span className="text-gradient">buscando tu servicio</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Súmate a la red de proveedores HVAC verificados de Chile. Publica tu perfil, recibe
          solicitudes reales y paga comisión solo por trabajo cerrado.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link to="/registro">
              Quiero ser proveedor
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/mapa">Ver el mapa</Link>
          </Button>
        </div>
      </section>

      <Reveal>
        <ForProviders />
      </Reveal>

      <Reveal>
        <section className="container-page py-16 sm:py-20" aria-labelledby="beneficios-heading">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="beneficios-heading" className="font-display text-3xl font-bold sm:text-4xl">
              Beneficios de ser proveedor verificado
            </h2>
            <p className="mt-4 text-muted-foreground">
              Herramientas y visibilidad para que te concentres en lo que haces mejor: el trabajo
              técnico.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map(({ icon: Icon, title, description }) => (
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
                  <p className="text-sm text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="bg-card py-16 sm:py-20" aria-labelledby="registro-heading">
          <div className="container-page">
            <div className="mx-auto max-w-2xl text-center">
              <h2 id="registro-heading" className="font-display text-3xl font-bold sm:text-4xl">
                Cómo registrarte y verificarte
              </h2>
              <p className="mt-4 text-muted-foreground">
                Cuatro pasos para empezar a recibir oportunidades.
              </p>
            </div>
            <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map(({ icon: Icon, title, description }, index) => (
                <li
                  key={title}
                  className="relative rounded-2xl border border-border bg-background p-6"
                >
                  <span className="font-display text-4xl font-extrabold text-primary/20">
                    0{index + 1}
                  </span>
                  <span className="mt-2 grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="container-page py-16 sm:py-20" aria-labelledby="comision-heading">
          <div className="grid gap-8 rounded-3xl border border-border bg-card p-6 sm:p-10 lg:grid-cols-2 lg:items-center">
            <div>
              <Badge>Comisión transparente</Badge>
              <h2
                id="comision-heading"
                className="mt-4 font-display text-3xl font-bold sm:text-4xl"
              >
                Pagas comisión solo por trabajo cerrado
              </h2>
              <p className="mt-4 text-muted-foreground">
                Un modelo alineado con tus resultados: si no cierras, no pagas. Sin mensualidades ni
                cargos por postular.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {INCLUDED.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-background p-6">
              <p className="text-sm text-muted-foreground">Ejemplo de comisión</p>
              <p className="mt-2 font-display text-4xl font-bold text-primary">10%</p>
              <p className="text-sm text-muted-foreground">
                sobre el valor del trabajo que cierras
              </p>
              <Separator className="my-5" />
              <dl className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Trabajo cerrado</dt>
                  <dd className="font-semibold">$1.000.000</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Comisión plataforma</dt>
                  <dd className="font-semibold">$100.000</dd>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-2">
                  <dt className="font-medium">Recibes</dt>
                  <dd className="font-display text-lg font-bold text-success">$900.000</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <Faq
          id="faq-proveedores"
          title="Preguntas de proveedores"
          description="Dudas frecuentes sobre el registro, la verificación y la comisión."
          items={PROVIDER_FAQ}
        />
      </Reveal>

      <Reveal>
        <FinalCta />
      </Reveal>
    </div>
  );
}
