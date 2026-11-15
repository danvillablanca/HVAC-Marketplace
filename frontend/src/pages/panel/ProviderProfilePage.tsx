import { RequireRole } from "@/features/auth";
import { ProviderProfileForm, useMyProviderProfile } from "@/features/panel";
import { Skeleton } from "@/components/ui/skeleton";

function ProviderProfileContent() {
  const { data: profile, isLoading, error } = useMyProviderProfile();

  return (
    <section className="container-page max-w-3xl space-y-6 py-10">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">Perfil de tu empresa</h1>
        <p className="mt-1 text-muted-foreground">
          {profile
            ? "Mantén al día tus servicios, cobertura y disponibilidad."
            : "Completa tu perfil para poder solicitar la verificación y recibir solicitudes."}
        </p>
      </header>
      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : error ? (
        <p role="alert" className="text-destructive">
          No se pudo cargar tu perfil.
        </p>
      ) : (
        <ProviderProfileForm profile={profile ?? null} />
      )}
    </section>
  );
}

export default function ProviderProfilePage() {
  return (
    <RequireRole roles={["proveedor"]}>
      <ProviderProfileContent />
    </RequireRole>
  );
}
