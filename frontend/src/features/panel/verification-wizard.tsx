import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  BadgeCheck,
  Building2,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  FileText,
  Send,
  ShieldCheck,
} from "lucide-react";
import { isValidRut, normalizePhone, providerUpsertSchema } from "@hvac/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth";

const STEPS = [
  { title: "Datos de empresa", description: "Identificacion legal del proveedor" },
  { title: "Documentos", description: "Antecedentes de respaldo obligatorios" },
  { title: "Revision y envio", description: "Confirma la informacion y envia a ASHRAE" },
];

const COMPANY_SCHEMA = providerUpsertSchema.pick({
  legalName: true,
  rut: true,
  phone: true,
  email: true,
});

const DOCUMENTS = [
  { id: "identidad", label: "Cedula de identidad del representante legal" },
  { id: "sec", label: "Certificado de instalador electrico / SEC" },
  { id: "ashrae", label: "Certificacion ASHRAE o equivalente tecnico" },
  { id: "boleta", label: "Boleta electronica habilitada" },
];

interface CompanyForm {
  legalName: string;
  rut: string;
  phone: string;
  email: string;
}

export function VerificationWizard() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<CompanyForm>({
    legalName: "",
    rut: "",
    phone: "",
    email: user?.email ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [documents, setDocuments] = useState<Record<string, boolean>>({
    identidad: false,
    sec: false,
    ashrae: false,
    boleta: false,
  });
  const [documentsError, setDocumentsError] = useState<string | null>(null);

  const progress = submitted ? 100 : Math.round(((step + 1) / STEPS.length) * 100);

  const checklist = useMemo(
    () => [
      { label: "RUT valido (modulo 11)", ok: isValidRut(form.rut) },
      { label: "Nombre / razon social", ok: form.legalName.trim().length >= 3 },
      { label: "Telefono de contacto", ok: /^\+56\d{9}$/.test(normalizePhone(form.phone)) },
      { label: "Correo electronico", ok: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) },
    ],
    [form],
  );

  function update(field: keyof CompanyForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function nextStep() {
    if (step === 0) {
      const parsed = COMPANY_SCHEMA.safeParse(form);
      if (!parsed.success) {
        const fieldErrors: Record<string, string> = {};
        for (const [field, messages] of Object.entries(parsed.error.flatten().fieldErrors)) {
          if (messages && messages.length > 0) fieldErrors[field] = messages[0];
        }
        setErrors(fieldErrors);
        return;
      }
      setErrors({});
      setStep(1);
      return;
    }
    if (step === 1) {
      if (!DOCUMENTS.every((document) => documents[document.id])) {
        setDocumentsError("Debes adjuntar todos los documentos obligatorios.");
        return;
      }
      setDocumentsError(null);
      setStep(2);
    }
  }

  function previousStep() {
    setStep((current) => Math.max(0, current - 1));
  }

  if (submitted) {
    return (
      <section className="container-page py-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="mx-auto max-w-2xl">
            <CardHeader className="items-center text-center">
              <span className="grid size-12 place-items-center rounded-full bg-warning/15 text-warning">
                <Clock className="size-6" />
              </span>
              <CardTitle className="mt-2 text-2xl">Solicitud en revision</CardTitle>
              <CardDescription>
                Recibimos tus antecedentes. El equipo ASHRAE los revisara en un plazo de 2 a 5 dias
                habiles.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <Badge variant="warning">
                  <Clock className="size-3" /> Estado: en revision
                </Badge>
              </div>

              <div className="rounded-lg border border-border bg-secondary/40 p-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <ShieldCheck className="size-4 text-primary" /> Checklist ASHRAE minimo
                </p>
                <ul className="space-y-2">
                  {checklist.map((item) => (
                    <li key={item.label} className="flex items-center gap-2 text-sm">
                      {item.ok ? (
                        <CheckCircle2 className="size-4 text-success" />
                      ) : (
                        <Circle className="size-4 text-muted-foreground" />
                      )}
                      <span className={cn(!item.ok && "text-muted-foreground")}>{item.label}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button asChild>
                  <Link to="/panel/proveedor">Volver al panel</Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSubmitted(false);
                    setStep(0);
                  }}
                >
                  Editar datos
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="container-page space-y-8 py-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold sm:text-3xl">Verificacion de proveedor</h1>
        <p className="text-muted-foreground">
          Completa los antecedentes para obtener el sello ASHRAE en tu perfil.
        </p>
      </header>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            Paso {step + 1} de {STEPS.length}: {STEPS[step].title}
          </span>
          <span className="text-muted-foreground">{progress}%</span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label="Progreso de la verificacion"
          className="h-2 w-full overflow-hidden rounded-full bg-secondary"
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <ol className="grid gap-2 sm:grid-cols-3">
          {STEPS.map((item, index) => (
            <li
              key={item.title}
              className={cn(
                "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
                index === step
                  ? "border-primary/50 bg-primary/5 text-foreground"
                  : "border-border text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold",
                  index <= step ? "bg-primary text-primary-foreground" : "bg-secondary",
                )}
              >
                {index < step ? <Check className="size-3.5" /> : index + 1}
              </span>
              <span className="font-medium">{item.title}</span>
            </li>
          ))}
        </ol>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {step === 0 && <Building2 className="size-5 text-primary" />}
            {step === 1 && <FileText className="size-5 text-primary" />}
            {step === 2 && <ShieldCheck className="size-5 text-primary" />}
            {STEPS[step].title}
          </CardTitle>
          <CardDescription>{STEPS[step].description}</CardDescription>
        </CardHeader>
        <CardContent>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {step === 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="legalName">Razon social</Label>
                  <Input
                    id="legalName"
                    value={form.legalName}
                    onChange={(event) => update("legalName", event.target.value)}
                    aria-invalid={Boolean(errors.legalName)}
                    aria-describedby={errors.legalName ? "legalName-error" : undefined}
                    placeholder="Clima Andes SpA"
                  />
                  {errors.legalName && (
                    <p
                      id="legalName-error"
                      role="alert"
                      aria-live="polite"
                      className="text-sm text-destructive"
                    >
                      {errors.legalName}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rut">RUT</Label>
                  <Input
                    id="rut"
                    value={form.rut}
                    onChange={(event) => update("rut", event.target.value)}
                    aria-invalid={Boolean(errors.rut)}
                    aria-describedby={errors.rut ? "rut-error" : undefined}
                    placeholder="76.543.210-K"
                  />
                  {errors.rut && (
                    <p
                      id="rut-error"
                      role="alert"
                      aria-live="polite"
                      className="text-sm text-destructive"
                    >
                      {errors.rut}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">Telefono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(event) => update("phone", event.target.value)}
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={errors.phone ? "phone-error" : undefined}
                    placeholder="+56 9 1234 5678"
                  />
                  {errors.phone && (
                    <p
                      id="phone-error"
                      role="alert"
                      aria-live="polite"
                      className="text-sm text-destructive"
                    >
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="email">Correo de contacto</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(event) => update("email", event.target.value)}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    placeholder="contacto@empresa.cl"
                  />
                  {errors.email && (
                    <p
                      id="email-error"
                      role="alert"
                      aria-live="polite"
                      className="text-sm text-destructive"
                    >
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-3">
                {DOCUMENTS.map((document) => (
                  <label
                    key={document.id}
                    htmlFor={`doc-${document.id}`}
                    className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-4 transition-colors hover:bg-secondary/60"
                  >
                    <input
                      id={`doc-${document.id}`}
                      type="checkbox"
                      className="size-4 accent-[var(--primary)]"
                      checked={documents[document.id]}
                      onChange={(event) => {
                        setDocuments((current) => ({
                          ...current,
                          [document.id]: event.target.checked,
                        }));
                        setDocumentsError(null);
                      }}
                    />
                    <span className="text-sm">{document.label}</span>
                  </label>
                ))}
                {documentsError && (
                  <p role="alert" aria-live="polite" className="text-sm text-destructive">
                    {documentsError}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Simulacion de carga: en esta demo los documentos se marcan como adjuntos.
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <dl className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm text-muted-foreground">Razon social</dt>
                    <dd className="font-medium">{form.legalName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">RUT</dt>
                    <dd className="font-medium">{form.rut}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Telefono</dt>
                    <dd className="font-medium">{form.phone}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Correo</dt>
                    <dd className="font-medium">{form.email}</dd>
                  </div>
                </dl>

                <div className="rounded-lg border border-border bg-secondary/40 p-4">
                  <p className="mb-3 flex items-center gap-2 text-sm font-medium">
                    <BadgeCheck className="size-4 text-primary" /> Checklist ASHRAE minimo
                  </p>
                  <ul className="space-y-2">
                    {checklist.map((item) => (
                      <li key={item.label} className="flex items-center gap-2 text-sm">
                        {item.ok ? (
                          <CheckCircle2 className="size-4 text-success" />
                        ) : (
                          <Circle className="size-4 text-muted-foreground" />
                        )}
                        <span className={cn(!item.ok && "text-muted-foreground")}>
                          {item.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </motion.div>

          <div className="mt-8 flex items-center justify-between gap-2">
            <Button variant="ghost" onClick={previousStep} disabled={step === 0}>
              <ChevronLeft className="size-4" />
              Atras
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={nextStep}>
                Continuar
                <ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button onClick={() => setSubmitted(true)}>
                <Send className="size-4" />
                Enviar a revision
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
