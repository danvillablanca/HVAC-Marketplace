import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="font-display text-6xl font-bold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-semibold">Pagina no encontrada</h1>
      <p className="mt-2 text-muted-foreground">La pagina que buscas no existe o fue movida.</p>
      <Button asChild className="mt-6">
        <Link to="/">Volver al inicio</Link>
      </Button>
    </div>
  );
}
