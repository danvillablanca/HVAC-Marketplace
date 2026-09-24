import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Valor actual de la barra. */
  value?: number;
  /** Valor maximo de la escala. */
  max?: number;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, ...props }, ref) => {
    const clampedValue = Math.min(Math.max(value, 0), max);
    const percentage = max > 0 ? (clampedValue / max) * 100 : 0;

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={clampedValue}
        className={cn("relative h-2 w-full overflow-hidden rounded-full bg-secondary", className)}
        {...props}
      >
        <div
          className="h-full w-full rounded-full bg-primary transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
      </div>
    );
  },
);
Progress.displayName = "Progress";
