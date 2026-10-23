import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function Logo({ className, to = "/" }: { className?: string; to?: string }) {
  return (
    <Link
      to={to}
      className={cn("flex items-center gap-2.5", className)}
      aria-label="Marketplace HVAC, inicio"
    >
      <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          aria-hidden
        >
          <path d="M6 15c0-2.5 2-4.5 4.5-4.5H13a2.5 2.5 0 1 1 0 5h-2.5" strokeLinecap="round" />
          <path d="M6 9c0-1.6 1.3-3 2.9-3H10" strokeLinecap="round" className="text-accent" />
        </svg>
      </span>
      <span className="font-display text-lg font-bold tracking-tight">
        Marketplace<span className="text-primary"> HVAC</span>
      </span>
    </Link>
  );
}
