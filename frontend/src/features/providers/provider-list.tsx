import { SearchX } from "lucide-react";
import { motion } from "motion/react";
import type { ProviderSummary } from "@hvac/shared";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProviderCard } from "./provider-card";
import { cn } from "@/lib/utils";

export interface ProviderListProps {
  providers: ProviderSummary[];
  loading?: boolean;
  selectedId?: string | null;
  onHover?: (id: string | null) => void;
  onSelect?: (id: string) => void;
  emptyMessage?: string;
  className?: string;
}

function ProviderCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-4 w-32" />
      <div className="mt-3 flex gap-1.5">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="mt-3 flex justify-between border-t border-border/70 pt-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
    </Card>
  );
}

/** Listado accesible de proveedores con estados de carga y vacio. */
export function ProviderList({
  providers,
  loading = false,
  selectedId,
  onHover,
  onSelect,
  emptyMessage = "No encontramos proveedores con estos filtros.",
  className,
}: ProviderListProps) {
  if (loading) {
    return (
      <ul
        className={cn("flex flex-col gap-3", className)}
        aria-busy="true"
        aria-label="Cargando proveedores"
      >
        {Array.from({ length: 5 }).map((_, index) => (
          <li key={index}>
            <ProviderCardSkeleton />
          </li>
        ))}
      </ul>
    );
  }

  if (providers.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/60 px-6 py-12 text-center",
          className,
        )}
      >
        <SearchX className="size-8 text-muted-foreground" aria-hidden />
        <p className="font-medium text-foreground">Sin resultados</p>
        <p className="max-w-sm text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul className={cn("flex flex-col gap-3", className)} aria-label="Proveedores encontrados">
      {providers.map((provider, index) => (
        <motion.li
          key={provider.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.24) }}
        >
          <ProviderCard
            provider={provider}
            selected={provider.id === selectedId}
            onHover={onHover}
            onSelect={onSelect}
          />
        </motion.li>
      ))}
    </ul>
  );
}
