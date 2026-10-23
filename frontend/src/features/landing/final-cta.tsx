import { Link } from "react-router-dom";
import { ArrowRight, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section className="container-page py-16 sm:py-20" aria-labelledby="cta-heading">
      <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground sm:px-12 sm:py-16">
        <div className="pointer-events-none absolute inset-0 opacity-20" aria-hidden>
          <div className="absolute -top-16 -right-10 size-64 rounded-full bg-accent blur-2xl" />
          <div className="absolute -bottom-20 -left-10 size-56 rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-2xl">
          <h2 id="cta-heading" className="font-display text-3xl font-bold sm:text-4xl">
            Tu próximo proveedor HVAC está a un clic.
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            Publica tu requerimiento gratis o únete como proveedor verificado y empieza a recibir
            oportunidades cerca de ti.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" variant="accent">
              <Link to="/mapa">
                Publicar requerimiento
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-transparent bg-white text-primary hover:bg-white/90 hover:text-primary"
            >
              <Link to="/registro">
                <UserPlus className="size-4" />
                Ser proveedor
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
