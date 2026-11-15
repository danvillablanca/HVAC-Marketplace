import { Link, useNavigate } from "react-router-dom";
import { LogOut, Mail, Shield, User } from "lucide-react";
import { RequireRole, useAuth } from "@/features/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ROLE_LABELS: Record<string, string> = {
  cliente: "Cliente",
  proveedor: "Proveedor",
  admin: "Administrador",
};

function AccountContent() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const panelLink =
    user.role === "proveedor"
      ? "/panel/proveedor"
      : user.role === "admin"
        ? "/panel/admin/verificaciones"
        : "/panel/solicitudes";

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <section className="container-page max-w-2xl space-y-6 py-10">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">Mi cuenta</h1>
        <p className="mt-1 text-muted-foreground">Información de tu cuenta y configuración.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5" />
            Perfil
          </CardTitle>
          <CardDescription>Tu información personal en HVAC Connect.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Nombre</p>
              <p className="font-medium">{user.fullName ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Correo electrónico</p>
              <p className="font-medium flex items-center gap-1">
                <Mail className="size-3.5 text-muted-foreground" />
                {user.email}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rol</p>
              <Badge variant="secondary">
                <Shield className="size-3" />
                {ROLE_LABELS[user.role] ?? user.role}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ID</p>
              <p className="font-mono text-xs text-muted-foreground">{user.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accesos rápidos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={panelLink}>Mi panel</Link>
          </Button>
          {user.role === "proveedor" && (
            <Button asChild variant="outline" size="sm">
              <Link to="/panel/proveedor/verificacion">Verificación</Link>
            </Button>
          )}
          {user.role === "cliente" && (
            <Button asChild variant="outline" size="sm">
              <Link to="/panel/solicitudes/nueva">Nueva solicitud</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Sesión</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleSignOut}>
            <LogOut className="size-4 mr-1" />
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}

export default function AccountPage() {
  return (
    <RequireRole roles={["cliente", "proveedor", "admin"]}>
      <AccountContent />
    </RequireRole>
  );
}
