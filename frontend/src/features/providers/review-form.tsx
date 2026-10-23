import { useState, type FormEvent } from "react";
import { Loader2, Star } from "lucide-react";
import { useCreateReview } from "@/features/providers/hooks";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface ReviewFormProps {
  providerId: string;
  onSuccess?: () => void;
  className?: string;
}

/** Formulario para crear una resena (1-5 estrellas + comentario). */
export function ReviewForm({ providerId, onSuccess, className }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const createReview = useCreateReview();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (rating < 1) return;
    createReview.mutate(
      { providerId, rating, comment: comment.trim() || undefined },
      {
        onSuccess: () => {
          setRating(0);
          setComment("");
          onSuccess?.();
        },
      },
    );
  };

  if (createReview.isSuccess) {
    return (
      <div
        className={cn(
          "rounded-xl border border-success/30 bg-success/10 px-4 py-6 text-center text-sm text-foreground",
          className,
        )}
        role="status"
      >
        <p className="font-semibold text-success">Gracias por tu resena</p>
        <p className="mt-1 text-muted-foreground">Tu opinion ayuda a otros clientes.</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() => createReview.reset()}
        >
          Escribir otra
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-3", className)}>
      <div>
        <Label>Tu calificacion</Label>
        <div
          className="mt-1.5 flex items-center gap-1"
          role="radiogroup"
          aria-label="Calificacion de 1 a 5 estrellas"
        >
          {[1, 2, 3, 4, 5].map((value) => {
            const active = value <= (hovered || rating);
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating === value}
                aria-label={`${value} ${value === 1 ? "estrella" : "estrellas"}`}
                onMouseEnter={() => setHovered(value)}
                onMouseLeave={() => setHovered(0)}
                onFocus={() => setHovered(value)}
                onBlur={() => setHovered(0)}
                onClick={() => setRating(value)}
                className="rounded-md p-0.5 transition-transform hover:scale-110 focus-visible:outline-none"
              >
                <Star
                  className={cn(
                    "size-6",
                    active ? "fill-warning text-warning" : "text-muted-foreground/40",
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label htmlFor="review-comment">Comentario (opcional)</Label>
        <Textarea
          id="review-comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          maxLength={1500}
          placeholder="Cuenta tu experiencia con este proveedor..."
          className="mt-1.5"
        />
      </div>

      {createReview.isError && (
        <p className="text-sm text-destructive" role="alert">
          No pudimos publicar tu resena. Intenta nuevamente.
        </p>
      )}

      <Button type="submit" disabled={rating < 1 || createReview.isPending}>
        {createReview.isPending && <Loader2 className="size-4 animate-spin" />}
        Publicar resena
      </Button>
    </form>
  );
}
