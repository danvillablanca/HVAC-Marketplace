import { MapPin } from "lucide-react";
import { formatCLP, formatDistance, type ProviderSummary, type ServiceSegment } from "@hvac/shared";
import { Card } from "@/components/ui/card";
import { StarRating } from "./star-rating";
import { VerificationBadge } from "./verification-badge";
import { cn } from "@/lib/utils";

const SEGMENT_LABELS: Record<ServiceSegment, string> = {
  residencial: "Residencial",
  comercial: "Comercial",
  industrial: "Industrial",
};

export interface ProviderCardProps {
  provider: ProviderSummary;
  selected?: boolean;
  onHover?: (id: string | null) => void;
  onSelect?: (id: string) => void;
}

/** Tarjeta resumen de un proveedor para listados y hojas moviles. */
export function ProviderCard({ provider, selected = false, onHover, onSelect }: ProviderCardProps) {
  const visibleServices = provider.services.slice(0, 3);
  const extraServices = provider.services.length - visibleServices.length;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(provider.id)}
      onMouseEnter={() => onHover?.(provider.id)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(provider.id)}
      onBlur={() => onHover?.(null)}
      aria-pressed={selected}
      className="block w-full rounded-xl text-left focus-visible:outline-none"
    >
      <Card
        className={cn(
          "p-4 transition-all hover:border-primary/50 hover:shadow-md",
          selected && "border-primary ring-2 ring-primary/30",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-base font-semibold leading-tight text-foreground">
            {provider.legalName}
          </h3>
          <VerificationBadge status={provider.verificationStatus} />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          <StarRating value={provider.ratingAvg} count={provider.reviewsCount} />
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" aria-hidden />
            {provider.distanceMeters !== null ? formatDistance(provider.distanceMeters) : "—"}
            {provider.commune ? ` · ${provider.commune}` : ""}
          </span>
        </div>

        {visibleServices.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {visibleServices.map((service) => (
              <li
                key={service}
                className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
              >
                {service}
              </li>
            ))}
            {extraServices > 0 && (
              <li className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                +{extraServices} mas
              </li>
            )}
          </ul>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-3">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {SEGMENT_LABELS[provider.segment]}
          </span>
          <span className="text-sm text-muted-foreground">
            Desde{" "}
            <span className="font-semibold text-foreground">{formatCLP(provider.priceFrom)}</span>
          </span>
        </div>
      </Card>
    </button>
  );
}
