import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { LayoutDashboard, LogIn, Menu, MessageCircleQuestion, Search, User } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth";
import { NotificationBell } from "@/features/notifications";

type Audience = "guest" | "cliente" | "proveedor" | "admin";

// Cada rol ve solo lo que puede usar: el proveedor no contrata, el cliente no cotiza.
const NAV: Array<{ to: string; label: string; for: Audience[] }> = [
  { to: "/mapa", label: "Mapa", for: ["guest", "cliente", "admin"] },
  { to: "/buscar", label: "Buscar proveedores", for: ["guest", "cliente", "admin"] },
  { to: "/chat", label: "Asistente IA", for: ["guest", "cliente"] },
  { to: "/para-proveedores", label: "Para proveedores", for: ["guest"] },
  { to: "/panel/proveedor/bandeja", label: "Bandeja", for: ["proveedor"] },
  { to: "/panel/proveedor/perfil", label: "Mi empresa", for: ["proveedor"] },
  { to: "/panel/admin/verificaciones", label: "Verificaciones", for: ["admin"] },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const nav = NAV.filter((item) => item.for.includes(user?.role ?? "guest"));

  // Panel link depends on role
  const panelLink = user
    ? user.role === "proveedor"
      ? "/panel/proveedor"
      : user.role === "admin"
        ? "/panel/admin/verificaciones"
        : "/panel/solicitudes"
    : null;

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                  isActive && "bg-secondary text-foreground",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          {user ? (
            <>
              <NotificationBell />
              {panelLink && (
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link to={panelLink}>
                    <User className="size-4 mr-1" />
                    Mi panel
                  </Link>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex"
                onClick={() => signOut()}
              >
                Salir
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link to="/ingresar">
                  <LogIn className="size-4" />
                  Ingresar
                </Link>
              </Button>
              <Button asChild className="hidden sm:inline-flex">
                <Link to="/registro">Crear cuenta</Link>
              </Button>
            </>
          )}

          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" aria-label="Abrir menu">
                <Menu className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {nav.map((item) => (
                <DropdownMenuItem key={item.to} asChild>
                  <Link to={item.to} className="cursor-pointer">
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              {user && panelLink ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link to={panelLink} className="cursor-pointer">
                      <LayoutDashboard className="size-4" /> Mi panel
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => signOut()} className="cursor-pointer">
                    <LogIn className="size-4" /> Salir
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link to="/ingresar" className="cursor-pointer">
                      <LogIn className="size-4" /> Ingresar
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/registro" className="cursor-pointer">
                      <LayoutDashboard className="size-4" /> Crear cuenta
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

export const QUICK_LINKS = [
  { to: "/mapa", label: "Mapa", icon: Search },
  { to: "/chat", label: "Asistente", icon: MessageCircleQuestion },
];
