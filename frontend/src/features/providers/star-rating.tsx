import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StarRatingProps {
  value: number | null | undefined;
  count?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
} as const;

/** Calificacion en estrellas (solo lectura). */
export function StarRating({ value, count, size = "sm", className }: StarRatingProps) {
  const rating = typeof value === "number" && Number.isFinite(value) ? value : 0;
  const filled = Math.round(rating);
  const sizeClass = SIZES[size];

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className="flex items-center gap-0.5"
        role="img"
        aria-label={`Calificacion ${rating.toFixed(1)} de 5`}
      >
        {[1, 2, 3, 4, 5].map((position) => (
          <Star
            key={position}
            aria-hidden
            className={cn(
              sizeClass,
              position <= filled ? "fill-warning text-warning" : "text-muted-foreground/35",
            )}
          />
        ))}
      </span>
      <span className="text-xs text-muted-foreground">
        {rating.toFixed(1)}
        {count !== undefined ? ` (${count})` : ""}
      </span>
    </span>
  );
}
