import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { RequireRole, useAuth } from "@/features/auth";
import { Button } from "@/components/ui/button";
import { RequestList } from "@/features/requests";

function ClientRequestsContent() {
  const { user } = useAuth();
  const firstName = user?.fullName?.split(" ")[0] ?? "cliente";

  return (
    <section className="container-page space-y-8 py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Hola, {firstName}</h1>
          <p className="mt-1 text-muted-foreground">
            Revisa el estado de tus solicitudes de servicio HVAC.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/buscar">
              <Search className="size-4" />
              Buscar proveedores
            </Link>
          </Button>
          <Button asChild>
            <Link to="/panel/solicitudes/nueva">
              <Plus className="size-4" />
              Nueva solicitud
            </Link>
          </Button>
        </div>
      </header>

      <RequestList />
    </section>
  );
}

export default function ClientRequestsPage() {
  return (
    <RequireRole roles={["cliente"]}>
      <ClientRequestsContent />
    </RequireRole>
  );
}
