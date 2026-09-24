import { formatDate, type Review } from "@hvac/shared";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "./star-rating";
import { cn } from "@/lib/utils";

export interface ReviewListProps {
  reviews: Review[];
  className?: string;
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase() || "?"
  );
}

/** Listado de resenas de un proveedor. */
export function ReviewList({ reviews, className }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <p
        className={cn(
          "rounded-lg border border-dashed border-border bg-card/60 px-4 py-8 text-center text-sm text-muted-foreground",
          className,
        )}
      >
        Aun no hay resenas. Se el primero en evaluar a este proveedor.
      </p>
    );
  }

  return (
    <ul className={cn("flex flex-col divide-y divide-border", className)}>
      {reviews.map((review) => (
        <li key={review.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
          <Avatar className="size-9">
            <AvatarFallback>{initials(review.authorName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-sm font-semibold text-foreground">{review.authorName}</span>
              {review.verified && (
                <Badge variant="success" className="text-[10px]">
                  Verificada
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</span>
            </div>
            <StarRating value={review.rating} className="mt-1" />
            {review.comment && (
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {review.comment}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
