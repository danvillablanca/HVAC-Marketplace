import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { LayoutDashboard, LogIn, Menu, MessageCircleQuestion, Search } from "lucide-react";
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

const NAV = [
  { to: "/mapa", label: "Mapa" },
  { to: "/buscar", label: "Buscar proveedores" },
  { to: "/chat", label: "Asistente IA" },
  { to: "/para-proveedores", label: "Para proveedores" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
          {NAV.map((item) => (
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
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link to="/ingresar">
              <LogIn className="size-4" />
              Ingresar
            </Link>
          </Button>
          <Button asChild className="hidden sm:inline-flex">
            <Link to="/registro">Crear cuenta</Link>
          </Button>

          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" aria-label="Abrir menu">
                <Menu className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {NAV.map((item) => (
                <DropdownMenuItem key={item.to} asChild>
                  <Link to={item.to} className="cursor-pointer">
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
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
