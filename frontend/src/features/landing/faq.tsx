import { ChevronDown } from "lucide-react";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqProps {
  items?: readonly FaqItem[];
  title?: string;
  description?: string;
  id?: string;
}

const DEFAULT_FAQ: readonly FaqItem[] = [
  {
    question: "¿Cómo verifican a los proveedores?",
    answer:
      "Solicitamos RUT de la empresa, documentación legal y certificaciones técnicas del rubro. Un equipo revisa cada antecedente antes de habilitar el perfil y lo actualiza periódicamente.",
  },
  {
    question: "¿Cuánto cuesta publicar un requerimiento?",
    answer:
      "Publicar requerimientos y recibir cotizaciones es gratis para los clientes. No cobramos por usar el mapa ni por contactar proveedores.",
  },
  {
    question: "¿Qué cobertura tienen en Chile?",
    answer:
      "Partimos con las principales ciudades y regiones, y seguimos sumando proveedores. Puedes filtrar por comuna y radio para ver la cobertura real cerca de tu proyecto.",
  },
  {
    question: "¿Qué significa el respaldo de ASHRAE?",
    answer:
      "Promovemos las buenas prácticas y los estándares técnicos de ASHRAE en climatización y refrigeración. Los perfiles que cumplen estos criterios reciben el sello correspondiente.",
  },
  {
    question: "¿Cómo cuidan mi privacidad?",
    answer:
      "Tus datos de contacto y los detalles del proyecto solo se comparten con los proveedores que elijas. Nunca publicamos tu información sin tu autorización.",
  },
];

export function Faq({
  items = DEFAULT_FAQ,
  title = "Preguntas frecuentes",
  description = "Todo lo que necesitas saber antes de publicar tu primer requerimiento.",
  id = "faq",
}: FaqProps) {
  return (
    <section id={id} className="container-page py-16 sm:py-20" aria-labelledby={`${id}-heading`}>
      <div className="mx-auto max-w-2xl text-center">
        <h2 id={`${id}-heading`} className="font-display text-3xl font-bold sm:text-4xl">
          {title}
        </h2>
        {description ? <p className="mt-4 text-muted-foreground">{description}</p> : null}
      </div>

      <div className="mx-auto mt-10 max-w-3xl divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {items.map((item) => (
          <details key={item.question} className="group p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
              <span>{item.question}</span>
              <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-sm text-muted-foreground">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
