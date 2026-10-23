import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarClock,
  ChevronRight,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldAlert,
} from "lucide-react";
import { formatCLP, formatPhone } from "@hvac/shared";
import { useProvider, useProviderReviews } from "@/features/providers/hooks";
import {
  LeadForm,
  ReviewForm,
  ReviewList,
  StarRating,
  VerificationBadge,
} from "@/features/providers";
import { MapView } from "@/features/map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

function ProviderPageSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default function ProviderPage() {
  const { id } = useParams<{ id: string }>();
  const detailQuery = useProvider(id);
  const reviewsQuery = useProviderReviews(id);
  const provider = detailQuery.data;
  const [contactOpen, setContactOpen] = useState(false);

  if (detailQuery.isLoading) {
    return (
      <div className="container-page py-8">
        <ProviderPageSkeleton />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="container-page py-16">
        <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-center">
          <ShieldAlert className="size-10 text-muted-foreground" aria-hidden />
          <h1 className="font-display text-2xl font-bold text-foreground">
            Proveedor no encontrado
          </h1>
          <p className="text-sm text-muted-foreground">
            La ficha que buscas no existe o fue removida.
          </p>
          <Button asChild variant="outline">
            <Link to="/buscar">
              <ArrowLeft className="size-4" />
              Volver a la busqueda
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <nav aria-label="Ruta de navegacion" className="mb-4">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <li>
            <Link to="/" className="hover:text-foreground">
              Inicio
            </Link>
          </li>
          <ChevronRight className="size-3.5" aria-hidden />
          <li>
            <Link to="/buscar" className="hover:text-foreground">
              Proveedores
            </Link>
          </li>
          <ChevronRight className="size-3.5" aria-hidden />
          <li aria-current="page" className="truncate font-medium text-foreground">
            {provider.legalName}
          </li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <header>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                {provider.legalName}
              </h1>
              <VerificationBadge status={provider.verificationStatus} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <StarRating value={provider.ratingAvg} count={provider.reviewsCount} size="md" />
              <Badge variant="outline">{provider.segment}</Badge>
              {provider.commune && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" aria-hidden />
                  {provider.address ?? provider.commune}
                </span>
              )}
            </div>
          </header>

          {provider.description && (
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-foreground">Sobre el proveedor</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {provider.description}
              </p>
            </Card>
          )}

          {provider.servicesDetailed.length > 0 && (
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-foreground">Servicios y precios</h2>
              <ul className="mt-3 divide-y divide-border">
                {provider.servicesDetailed.map((service) => (
                  <li key={service.id} className="flex items-center justify-between gap-3 py-3">
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
            </Card>
          )}

          {provider.modalities.length > 0 && (
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-foreground">Modalidades de atencion</h2>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {provider.modalities.map((modality) => (
                  <li key={modality}>
                    <Badge variant="secondary">{modality}</Badge>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {provider.location && (
            <Card className="overflow-hidden p-0">
              <div className="p-5 pb-3">
                <h2 className="text-sm font-semibold text-foreground">Ubicacion</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {provider.address ?? provider.commune}
                </p>
              </div>
              <MapView
                providers={[provider]}
                center={provider.location}
                radiusKm={3}
                selectedId={provider.id}
                className="h-64"
              />
            </Card>
          )}

          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <CalendarClock className="size-4" aria-hidden />
                Resenas ({provider.reviewsCount})
              </h2>
            </div>
            <ReviewList reviews={reviewsQuery.data ?? []} className="mt-3" />
            <Separator className="my-5" />
            <h3 className="text-sm font-semibold text-foreground">Deja tu resena</h3>
            <ReviewForm providerId={provider.id} className="mt-3" />
          </Card>
        </div>

        <aside className="flex h-fit flex-col gap-4 lg:sticky lg:top-20">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-foreground">Contacto</h2>
            <div className="mt-3 flex flex-col gap-2">
              <Button type="button" onClick={() => setContactOpen(true)}>
                <CalendarClock className="size-4" />
                Agendar / Contactar
              </Button>
              {provider.phone && (
                <>
                  <Button asChild variant="outline">
                    <a href={`tel:${provider.phone}`}>
                      <Phone className="size-4" />
                      {formatPhone(provider.phone)}
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
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-foreground">Datos de la empresa</h2>
            <dl className="mt-3 flex flex-col gap-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">RUT</dt>
                <dd className="font-medium text-foreground">{provider.rut}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Segmento</dt>
                <dd className="font-medium capitalize text-foreground">{provider.segment}</dd>
              </div>
              {provider.commune && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Comuna</dt>
                  <dd className="font-medium text-foreground">{provider.commune}</dd>
                </div>
              )}
            </dl>
          </Card>
        </aside>
      </div>

      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contactar a {provider.legalName}</DialogTitle>
            <DialogDescription>
              Cuentanos que necesitas y el proveedor te contactara.
            </DialogDescription>
          </DialogHeader>
          <LeadForm providerId={provider.id} providerName={provider.legalName} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
