import {
  Building2,
  CalendarClock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldAlert,
} from "lucide-react";
import { formatCLP, formatPhone } from "@hvac/shared";
import { useProvider, useProviderReviews } from "@/features/providers/hooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { LeadForm } from "./lead-form";
import { ReviewForm } from "./review-form";
import { ReviewList } from "./review-list";
import { StarRating } from "./star-rating";
import { VerificationBadge } from "./verification-badge";

export interface ProviderModalProps {
  providerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Modal con el detalle completo del proveedor, contacto y resenas. */
export function ProviderModal({ providerId, open, onOpenChange }: ProviderModalProps) {
  const detailQuery = useProvider(providerId ?? undefined);
  const reviewsQuery = useProviderReviews(providerId ?? undefined);
  const provider = detailQuery.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl" aria-describedby={undefined}>
        {detailQuery.isLoading ? (
          <div className="flex flex-col gap-3">
            <DialogTitle className="sr-only">Cargando proveedor</DialogTitle>
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : !provider ? (
          <div className="py-10 text-center">
            <ShieldAlert className="mx-auto size-8 text-muted-foreground" aria-hidden />
            <DialogTitle className="mt-3">Proveedor no disponible</DialogTitle>
            <DialogDescription className="mt-1">
              No encontramos la ficha solicitada.
            </DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2 pr-6">
                <DialogTitle className="text-xl">{provider.legalName}</DialogTitle>
                <VerificationBadge status={provider.verificationStatus} />
              </div>
              <DialogDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <StarRating value={provider.ratingAvg} count={provider.reviewsCount} size="md" />
                {provider.commune && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5" aria-hidden />
                    {provider.commune}
                  </span>
                )}
                <Badge variant="outline">{provider.segment}</Badge>
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-5">
              {provider.description && (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {provider.description}
                </p>
              )}

              {provider.servicesDetailed.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-foreground">Servicios y precios</h3>
                  <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
                    {provider.servicesDetailed.map((service) => (
                      <li
                        key={service.id}
                        className="flex items-center justify-between gap-3 px-3 py-2.5"
                      >
                        <span className="text-sm text-foreground">{service.name}</span>
                        <span className="whitespace-nowrap text-sm font-semibold text-foreground">
                          {formatCLP(service.priceFrom)}
                          {service.unit ? (
                            <span className="ml-1 text-xs font-normal text-muted-foreground">
                              /{service.unit}
                            </span>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {provider.modalities.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-foreground">Modalidades</h3>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {provider.modalities.map((modality) => (
                      <li key={modality}>
                        <Badge variant="secondary">{modality}</Badge>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section>
                <h3 className="text-sm font-semibold text-foreground">Contacto</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {provider.phone && (
                    <>
                      <Button asChild>
                        <a href={`tel:${provider.phone}`}>
                          <Phone className="size-4" />
                          Llamar
                        </a>
                      </Button>
                      <Button asChild variant="outline">
                        <a
                          href={`https://wa.me/${provider.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MessageCircle className="size-4" />
                          WhatsApp
                        </a>
                      </Button>
                      <span className="inline-flex items-center px-1 text-sm text-muted-foreground">
                        {formatPhone(provider.phone)}
                      </span>
                    </>
                  )}
                  {provider.email && (
                    <Button asChild variant="ghost">
                      <a href={`mailto:${provider.email}`}>
                        <Mail className="size-4" />
                        {provider.email}
                      </a>
                    </Button>
                  )}
                </div>
              </section>

              <Separator />

              <section>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Building2 className="size-4" aria-hidden />
                  Solicitar cotizacion
                </h3>
                <div className="mt-3">
                  <LeadForm providerId={provider.id} providerName={provider.legalName} />
                </div>
              </section>

              <Separator />

              <section>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <CalendarClock className="size-4" aria-hidden />
                  Resenas ({provider.reviewsCount})
                </h3>
                <ReviewList reviews={reviewsQuery.data ?? []} className="mt-2" />
                <div className="mt-4 rounded-lg border border-border bg-secondary/40 p-4">
                  <h4 className="text-sm font-semibold text-foreground">Deja tu resena</h4>
                  <ReviewForm providerId={provider.id} className="mt-2" />
                </div>
              </section>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
