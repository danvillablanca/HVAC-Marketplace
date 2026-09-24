import { motion, useReducedMotion } from "motion/react";
import { Check, ClipboardList, Search } from "lucide-react";

const STEPS = [
  {
    icon: ClipboardList,
    title: "Publica",
    description:
      "Cuenta qué necesitas en 2 minutos: tipo de equipo, comuna y urgencia. Publicar es gratis.",
  },
  {
    icon: Search,
    title: "Compara",
    description:
      "Recibe cotizaciones de proveedores verificados y compáralas lado a lado sobre el mapa.",
  },
  {
    icon: Check,
    title: "Contrata",
    description:
      "Elige la mejor opción, coordina el trabajo y califica el servicio para ayudar a otros.",
  },
];

export function HowItWorks() {
  const reduce = useReducedMotion();

  return (
    <section className="bg-card py-16 sm:py-20" aria-labelledby="pasos-heading">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="pasos-heading" className="font-display text-3xl font-bold sm:text-4xl">
            Cómo funciona
          </h2>
          <p className="mt-4 text-muted-foreground">
            Tres pasos para pasar de la necesidad al proveedor correcto.
          </p>
        </div>

        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, description }, index) => (
            <motion.li
              key={title}
              initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: reduce ? 0 : index * 0.12 }}
              className="relative rounded-2xl border border-border bg-background p-6"
            >
              <span className="font-display text-4xl font-extrabold text-primary/20">
                0{index + 1}
              </span>
              <span className="mt-2 grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 font-display text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
