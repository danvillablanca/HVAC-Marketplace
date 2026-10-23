import { BadgeCheck, Clock, ShieldQuestion, ShieldX, type LucideIcon } from "lucide-react";
import type { ProviderVerificationStatus } from "@hvac/shared";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CONFIG: Record<
  ProviderVerificationStatus,
  { label: string; variant: BadgeProps["variant"]; icon: LucideIcon }
> = {
  verificado: { label: "Verificado", variant: "success", icon: BadgeCheck },
  en_revision: { label: "En revision", variant: "warning", icon: Clock },
  pendiente: { label: "Pendiente", variant: "secondary", icon: ShieldQuestion },
  rechazado: { label: "Rechazado", variant: "destructive", icon: ShieldX },
};

export interface VerificationBadgeProps {
  status: ProviderVerificationStatus;
  className?: string;
}

/** Estado de verificacion del proveedor. */
export function VerificationBadge({ status, className }: VerificationBadgeProps) {
  const { label, variant, icon: Icon } = CONFIG[status];
  return (
    <Badge variant={variant} className={cn("shrink-0", className)}>
      <Icon className="size-3.5" aria-hidden />
      {label}
    </Badge>
  );
}
