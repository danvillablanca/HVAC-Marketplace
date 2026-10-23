import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

function composeRefs<T>(...refs: Array<React.Ref<T> | undefined>): React.RefCallback<T> {
  return (node) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") {
        ref(node);
      } else {
        (ref as { current: T | null }).current = node;
      }
    }
  };
}

interface PopoverContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  contentId: string;
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null);

function usePopover(): PopoverContextValue {
  const context = React.useContext(PopoverContext);
  if (!context) {
    throw new Error("PopoverTrigger y PopoverContent deben usarse dentro de <Popover>.");
  }
  return context;
}

export interface PopoverProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Popover({
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
}: PopoverProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolled;

  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const contentId = React.useId();

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolled(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  React.useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (contentRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, setOpen]);

  const value = React.useMemo<PopoverContextValue>(
    () => ({ open, setOpen, triggerRef, contentRef, contentId }),
    [open, setOpen, contentId],
  );

  return (
    <PopoverContext.Provider value={value}>
      <div className="relative inline-block text-left">{children}</div>
    </PopoverContext.Provider>
  );
}

export interface PopoverTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const PopoverTrigger = React.forwardRef<HTMLButtonElement, PopoverTriggerProps>(
  ({ asChild = false, onClick, ...props }, ref) => {
    const { open, setOpen, triggerRef, contentId } = usePopover();
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={composeRefs<HTMLButtonElement>(ref, triggerRef)}
        type={asChild ? undefined : "button"}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? contentId : undefined}
        data-state={open ? "open" : "closed"}
        onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
          onClick?.(event);
          if (!event.defaultPrevented) setOpen(!open);
        }}
        {...props}
      />
    );
  },
);
PopoverTrigger.displayName = "PopoverTrigger";

export interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end";
  sideOffset?: number;
}

export const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ align = "center", sideOffset = 4, className, style, children, ...props }, ref) => {
    const { open, contentRef, contentId } = usePopover();

    React.useEffect(() => {
      if (open) contentRef.current?.focus();
    }, [open, contentRef]);

    if (!open) return null;

    const alignClass =
      align === "start" ? "left-0" : align === "end" ? "right-0" : "left-1/2 -translate-x-1/2";

    return (
      <div
        ref={composeRefs<HTMLDivElement>(ref, contentRef)}
        id={contentId}
        role="dialog"
        tabIndex={-1}
        style={{ marginTop: sideOffset, ...style }}
        className={cn(
          "absolute top-full z-50 w-72 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          alignClass,
          className,
        )}
        data-state="open"
        {...props}
      >
        {children}
      </div>
    );
  },
);
PopoverContent.displayName = "PopoverContent";
