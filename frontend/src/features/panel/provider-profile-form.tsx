import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, MapPin, Save } from "lucide-react";
import {
  COMMUNES,
  SERVICE_SEGMENTS,
  WEEK_DAYS,
  providerProfileSchema,
  type ProviderProfile,
  type ServiceSegment,
  type WeekDay,
} from "@hvac/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth";
import { useSaveProviderProfile, useServiceCatalog } from "./provider-hooks";

const SEGMENT_LABEL: Record<ServiceSegment, string> = {
  residencial: "Residencial",
  comercial: "Comercial",
  industrial: "Industrial",
};

type Hours = Partial<Record<WeekDay, { open: string; close: string } | null>>;

interface FormState {
  legalName: string;
  rut: string;
  segment: ServiceSegment;
  description: string;
  phone: string;
  email: string;
  yearsExperience: string;
  website: string;
  commune: string;
  address: string;
  coverageRadiusKm: number;
  isAvailable: boolean;
  weeklyHours: Hours;
  /** serviceId -> precio desde (texto del input) */
  services: Record<string, string>;
}

function initialState(
  profile: ProviderProfile | null,
  fallbackEmail: string,
  fallbackName: string,
): FormState {
  if (!profile) {
    return {
      legalName: fallbackName,
      rut: "",
      segment: "residencial",
      description: "",
      phone: "",
      email: fallbackEmail,
      yearsExperience: "",
      website: "",
      commune: "",
      address: "",
      coverageRadiusKm: 20,
      isAvailable: true,
      weeklyHours: Object.fromEntries(
        WEEK_DAYS.slice(0, 5).map((d) => [d.key, { open: "09:00", close: "18:00" }]),
      ),
      services: {},
    };
  }
  return {
    legalName: profile.legalName,
    rut: profile.rut,
    segment: profile.segment,
    description: profile.description,
    phone: profile.phone,
    email: profile.email,
    yearsExperience: profile.yearsExperience == null ? "" : String(profile.yearsExperience),
    website: profile.website,
    commune: profile.commune,
    address: profile.address,
    coverageRadiusKm: profile.coverageRadiusKm,
    isAvailable: profile.isAvailable,
    weeklyHours: profile.weeklyHours,
    services: Object.fromEntries(
      profile.services.map((s) => [s.serviceId, s.priceFrom == null ? "" : String(s.priceFrom)]),
    ),
  };
}

const REGIONS = [...new Set(COMMUNES.map((c) => c.region))];

interface ProviderProfileFormProps {
  profile: ProviderProfile | null;
}

/** REQ-PRO-01/02/03/06: edicion del perfil del proveedor por el propio proveedor. */
export function ProviderProfileForm({ profile }: ProviderProfileFormProps) {
  const { user } = useAuth();
  const catalog = useServiceCatalog();
  const save = useSaveProviderProfile();
  const [form, setForm] = useState<FormState>(() =>
    initialState(profile, user?.email ?? "", user?.fullName ?? ""),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) setForm(initialState(profile, "", ""));
  }, [profile]);

  const servicesBySegment = useMemo(() => {
    const groups = new Map<ServiceSegment, NonNullable<typeof catalog.data>>();
    for (const service of catalog.data ?? []) {
      groups.set(service.segment, [...(groups.get(service.segment) ?? []), service]);
    }
    return groups;
  }, [catalog.data]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setSaved(false);
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleService(id: string, checked: boolean) {
    setSaved(false);
    setForm((current) => {
      const services = { ...current.services };
      if (checked) services[id] = services[id] ?? "";
      else delete services[id];
      return { ...current, services };
    });
  }

  function setDay(day: WeekDay, value: { open: string; close: string } | null) {
    set("weeklyHours", { ...form.weeklyHours, [day]: value });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = providerProfileSchema.safeParse({
      ...form,
      yearsExperience: form.yearsExperience === "" ? null : Number(form.yearsExperience),
      weeklyHours: Object.fromEntries(
        WEEK_DAYS.map((d) => [d.key, form.weeklyHours[d.key] ?? null]),
      ),
      services: Object.entries(form.services).map(([serviceId, price]) => ({
        serviceId,
        priceFrom: price === "" ? null : Number(price),
      })),
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    try {
      await save.mutateAsync(parsed.data);
      setSaved(true);
    } catch {
      // el mensaje se muestra desde save.error
    }
  }

  const fieldError = (key: string) =>
    errors[key] ? (
      <p id={`${key}-error`} role="alert" className="text-sm text-destructive">
        {errors[key]}
      </p>
    ) : null;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Datos de la empresa</CardTitle>
          <CardDescription>Así te verán los clientes en tu perfil público.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="legalName">Nombre comercial o razón social</Label>
            <Input
              id="legalName"
              value={form.legalName}
              onChange={(e) => set("legalName", e.target.value)}
            />
            {fieldError("legalName")}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rut">RUT de la empresa</Label>
            <Input
              id="rut"
              value={form.rut}
              placeholder="76.543.210-K"
              onChange={(e) => set("rut", e.target.value)}
            />
            {fieldError("rut")}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="segment">Segmento principal</Label>
            <Select
              id="segment"
              value={form.segment}
              onChange={(e) => set("segment", e.target.value as ServiceSegment)}
            >
              {SERVICE_SEGMENTS.map((s) => (
                <option key={s} value={s}>
                  {SEGMENT_LABEL[s]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="yearsExperience">Años de experiencia</Label>
            <Input
              id="yearsExperience"
              type="number"
              min={0}
              max={80}
              value={form.yearsExperience}
              onChange={(e) => set("yearsExperience", e.target.value)}
            />
            {fieldError("yearsExperience")}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              rows={4}
              maxLength={1000}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Cuéntales a los clientes qué hacen y qué los diferencia."
            />
            <p className="text-right text-xs text-muted-foreground">
              {form.description.length}/1.000
            </p>
            {fieldError("description")}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contacto</CardTitle>
          <CardDescription>
            El teléfono y el correo se muestran al cliente solo cuando acepta tu cotización.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              type="tel"
              value={form.phone}
              placeholder="+56 9 1234 5678"
              onChange={(e) => set("phone", e.target.value)}
            />
            {fieldError("phone")}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Correo de contacto</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
            {fieldError("email")}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="website">Sitio web (opcional)</Label>
            <Input
              id="website"
              value={form.website}
              placeholder="https://tuempresa.cl"
              onChange={(e) => set("website", e.target.value)}
            />
            {fieldError("website")}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Servicios que ofreces</CardTitle>
          <CardDescription>
            Elige del catálogo los servicios de tu empresa. El precio “desde” es opcional y
            orientativo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {catalog.isLoading && (
            <p className="text-sm text-muted-foreground">Cargando catálogo...</p>
          )}
          {[...servicesBySegment.entries()].map(([segment, services]) => (
            <fieldset key={segment} className="space-y-2">
              <legend className="text-sm font-semibold">{SEGMENT_LABEL[segment]}</legend>
              {services.map((service) => {
                const checked = service.id in form.services;
                return (
                  <div
                    key={service.id}
                    className="flex flex-wrap items-center gap-3 rounded-md border border-border p-3"
                  >
                    <input
                      id={`svc-${service.id}`}
                      type="checkbox"
                      className="size-4 accent-primary"
                      checked={checked}
                      onChange={(e) => toggleService(service.id, e.target.checked)}
                    />
                    <Label htmlFor={`svc-${service.id}`} className="flex-1 font-normal">
                      {service.name}
                    </Label>
                    {checked && (
                      <Input
                        aria-label={`Precio desde para ${service.name}`}
                        type="number"
                        min={0}
                        step={1000}
                        className="w-40"
                        placeholder="Precio desde (CLP)"
                        value={form.services[service.id]}
                        onChange={(e) =>
                          set("services", { ...form.services, [service.id]: e.target.value })
                        }
                      />
                    )}
                  </div>
                );
              })}
            </fieldset>
          ))}
          {fieldError("services")}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ubicación y cobertura</CardTitle>
          <CardDescription>
            Recibirás solicitudes de clientes dentro de tu radio de cobertura.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="commune">Comuna base</Label>
            <Select
              id="commune"
              value={form.commune}
              onChange={(e) => set("commune", e.target.value)}
            >
              <option value="">Selecciona una comuna</option>
              {REGIONS.map((region) => (
                <optgroup key={region} label={region}>
                  {COMMUNES.filter((c) => c.region === region).map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
            {fieldError("commune")}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">Dirección (opcional)</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="coverageRadiusKm">Radio de cobertura: {form.coverageRadiusKm} km</Label>
            <input
              id="coverageRadiusKm"
              type="range"
              min={1}
              max={100}
              className="w-full accent-primary"
              value={form.coverageRadiusKm}
              onChange={(e) => set("coverageRadiusKm", Number(e.target.value))}
            />
            {form.commune && (
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-4" /> Atiendes hasta {form.coverageRadiusKm} km desde{" "}
                {form.commune}.
              </p>
            )}
            {fieldError("coverageRadiusKm")}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Disponibilidad</CardTitle>
          <CardDescription>
            Si te marcas como no disponible, no recibirás solicitudes nuevas hasta que vuelvas a
            activarte.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch
              id="isAvailable"
              checked={form.isAvailable}
              onCheckedChange={(value) => set("isAvailable", value)}
              aria-label="Disponible para nuevas solicitudes"
            />
            <span className="text-sm font-medium">
              {form.isAvailable ? "Disponible para nuevas solicitudes" : "No disponible"}
            </span>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Horario de atención</p>
            {WEEK_DAYS.map((day) => {
              const hours = form.weeklyHours[day.key] ?? null;
              return (
                <div key={day.key} className="flex flex-wrap items-center gap-3">
                  <label className="flex w-32 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="size-4 accent-primary"
                      checked={hours !== null}
                      onChange={(e) =>
                        setDay(day.key, e.target.checked ? { open: "09:00", close: "18:00" } : null)
                      }
                    />
                    {day.label}
                  </label>
                  {hours ? (
                    <>
                      <Input
                        type="time"
                        aria-label={`${day.label} apertura`}
                        className="w-32"
                        value={hours.open}
                        onChange={(e) => setDay(day.key, { ...hours, open: e.target.value })}
                      />
                      <span className="text-sm text-muted-foreground">a</span>
                      <Input
                        type="time"
                        aria-label={`${day.label} cierre`}
                        className="w-32"
                        value={hours.close}
                        onChange={(e) => setDay(day.key, { ...hours, close: e.target.value })}
                      />
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">Cerrado</span>
                  )}
                </div>
              );
            })}
            {fieldError("weeklyHours")}
          </div>
        </CardContent>
      </Card>

      {save.error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {save.error instanceof Error ? save.error.message : "No se pudo guardar el perfil."}
        </p>
      )}
      {Object.keys(errors).length > 0 && (
        <p role="alert" className="text-sm text-destructive">
          Revisa los campos marcados.
        </p>
      )}
      {saved && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm"
        >
          <CheckCircle2 className="size-4 text-success" /> Perfil guardado.
          {profile?.verificationStatus !== "verificado" && (
            <Link
              to="/panel/proveedor/verificacion"
              className="font-medium text-primary hover:underline"
            >
              Solicitar verificación
            </Link>
          )}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button asChild variant="ghost">
          <Link to="/panel/proveedor">Volver al panel</Link>
        </Button>
        <Button type="submit" disabled={save.isPending}>
          <Save className="size-4" />
          {save.isPending ? "Guardando..." : "Guardar perfil"}
        </Button>
      </div>
    </form>
  );
}
