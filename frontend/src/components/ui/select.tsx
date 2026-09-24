import * as React from "react";
import { cn } from "@/lib/utils";

/** Select nativo estilizado (menor dependencia, suficiente para el MVP). */
export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-10 w-full appearance-none rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm transition-colors focus-visible:border-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";
