import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type AccordionType = "single" | "multiple";

interface AccordionContextValue {
  openValues: string[];
  toggle: (value: string) => void;
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

function useAccordion(): AccordionContextValue {
  const context = React.useContext(AccordionContext);
  if (!context) {
    throw new Error("AccordionTrigger y AccordionContent deben usarse dentro de <Accordion>.");
  }
  return context;
}

interface AccordionItemContextValue {
  value: string;
  open: boolean;
  triggerId: string;
  contentId: string;
}

const AccordionItemContext = React.createContext<AccordionItemContextValue | null>(null);

function useAccordionItem(): AccordionItemContextValue {
  const context = React.useContext(AccordionItemContext);
  if (!context) {
    throw new Error("AccordionTrigger y AccordionContent deben usarse dentro de <AccordionItem>.");
  }
  return context;
}

function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

export interface AccordionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue"> {
  type?: AccordionType;
  collapsible?: boolean;
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string[]) => void;
}

export function Accordion({
  type = "single",
  collapsible = false,
  value,
  defaultValue,
  onValueChange,
  className,
  children,
  ...props
}: AccordionProps) {
  const [uncontrolled, setUncontrolled] = React.useState<string[]>(() => toArray(defaultValue));
  const isControlled = value !== undefined;
  const openValues = isControlled ? toArray(value) : uncontrolled;

  const toggle = React.useCallback(
    (itemValue: string) => {
      const isOpen = openValues.includes(itemValue);
      let next: string[];
      if (type === "multiple") {
        next = isOpen
          ? openValues.filter((current) => current !== itemValue)
          : [...openValues, itemValue];
      } else if (isOpen) {
        next = collapsible ? [] : openValues;
      } else {
        next = [itemValue];
      }
      if (!isControlled) setUncontrolled(next);
      onValueChange?.(next);
    },
    [openValues, type, collapsible, isControlled, onValueChange],
  );

  return (
    <AccordionContext.Provider value={{ openValues, toggle }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function AccordionItem({ value, className, children, ...props }: AccordionItemProps) {
  const { openValues } = useAccordion();
  const baseId = React.useId();
  const itemContext = React.useMemo<AccordionItemContextValue>(
    () => ({
      value,
      open: openValues.includes(value),
      triggerId: `accordion-trigger-${baseId}`,
      contentId: `accordion-content-${baseId}`,
    }),
    [value, openValues, baseId],
  );

  return (
    <AccordionItemContext.Provider value={itemContext}>
      <div className={cn("border-b border-border", className)} {...props}>
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

export function AccordionHeader({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("flex", className)} {...props} />;
}

export interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, children, onClick, ...props }, ref) => {
    const { toggle } = useAccordion();
    const { value, open, triggerId, contentId } = useAccordionItem();

    return (
      <button
        ref={ref}
        id={triggerId}
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) toggle(value);
        }}
        className={cn(
          "flex w-full items-center justify-between gap-2 py-4 text-left text-sm font-medium transition-colors hover:text-primary focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
        {...props}
      >
        <span>{children}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
    );
  },
);
AccordionTrigger.displayName = "AccordionTrigger";

export const AccordionContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { open, triggerId, contentId } = useAccordionItem();

  return (
    <div
      ref={ref}
      id={contentId}
      role="region"
      aria-labelledby={triggerId}
      hidden={!open}
      className={cn("overflow-hidden text-sm text-muted-foreground", open && "pb-4", className)}
      {...props}
    >
      {children}
    </div>
  );
});
AccordionContent.displayName = "AccordionContent";
