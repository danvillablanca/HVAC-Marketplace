import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-card">
      <div className="container-page grid gap-10 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Plataforma para encontrar y contratar proveedores HVAC verificados en Chile, con
            recomendaciones, cercania geoespacial y respaldo de estandares ASHRAE.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Plataforma</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link className="hover:text-foreground" to="/mapa">
                Mapa de proveedores
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" to="/buscar">
                Buscar
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" to="/chat">
                Asistente IA
              </Link>
            </li>
            <li>
              <Link className="hover:text-foreground" to="/registro">
                Ser proveedor
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Contacto</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <MapPin className="size-4" /> Santiago, Chile
            </li>
            <li className="flex items-center gap-2">
              <Mail className="size-4" /> contacto@hvac-marketplace.cl
            </li>
            <li className="flex items-center gap-2">
              <Phone className="size-4" /> +56 2 2526 4314
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-6 text-xs text-muted-foreground sm:flex-row">
          <p>Proyecto academico IIC3113 - Grupo 1. Cliente: ASHRAE Chile.</p>
          <p>Marketplace HVAC © {new Date().getFullYear()}</p>
        </div>
      </div>
    </footer>
  );
}
