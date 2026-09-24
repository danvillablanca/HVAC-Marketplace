import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { UserRole } from "@hvac/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "./auth-context";

interface RequireRoleProps {
  roles: UserRole[];
  children: ReactNode;
}

/**
 * Protege rutas por rol. Redirige a /ingresar si no hay sesion,
 * o si el usuario no posee ninguno de los roles permitidos.
 */
export function RequireRole({ roles, children }: RequireRoleProps) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container-page space-y-4 py-10" aria-busy="true" aria-live="polite">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!user || !role || !roles.includes(role)) {
    return <Navigate to="/ingresar" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
