import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Check, Inbox, MapPin, ShieldCheck, X } from "lucide-react";
import {
  formatRut,
  verificationDecisionSchema,
  type ProviderDetail,
  type ProviderVerificationStatus,
} from "@hvac/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { DEMO_PROVIDERS } from "@/data/providers";

const DECISION_SCHEMA = verificationDecisionSchema.pick({ decision: true, note: true });

const STATUS_LABEL: Record<ProviderVerificationStatus, string> = {
  pendiente: "Pendiente",
  en_revision: "En revision",
  verificado: "Verificado",
  rechazado: "Rechazado",
};

function isPending(status: ProviderVerificationStatus): boolean {
  return status === "en_revision" || status === "pendiente";
}

export function AdminVerificationTable() {
  const [providers, setProviders] = useState<ProviderDetail[]>(() =>
    DEMO_PROVIDERS.filter((provider) => isPending(provider.verificationStatus)),
  );
  const [rejectTarget, setRejectTarget] = useState<ProviderDetail | null>(null);
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);

  const pendingCount = useMemo(
    () => providers.filter((provider) => isPending(provider.verificationStatus)).length,
    [providers],
  );

  function decide(providerId: string, decision: "verificado" | "rechazado", decisionNote?: string) {
    const parsed = DECISION_SCHEMA.safeParse({ decision, note: decisionNote });
    if (!parsed.success) return;
    setProviders((current) =>
      current.map((provider) =>
        provider.id === providerId
          ? { ...provider, verificationStatus: parsed.data.decision }
          : provider,
      ),
    );
  }

  function handleReject() {
    if (!rejectTarget) return;
    const trimmed = note.trim();
    if (trimmed.length < 5) {
      setNoteError("Indica un motivo de al menos 5 caracteres.");
      return;
    }
    decide(rejectTarget.id, "rechazado", trimmed);
    setRejectTarget(null);
    setNote("");
    setNoteError(null);
  }

  return (
    <section className="container-page space-y-8 py-10">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Bandeja de verificacion</h1>
          <p className="mt-1 text-muted-foreground">
            Proveedores pendientes de revision por el comite ASHRAE.
          </p>
        </div>
        <Badge variant="warning" className="w-fit">
          <Inbox className="size-3" /> {pendingCount} en revision
        </Badge>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Proveedores por revisar</CardTitle>
          <CardDescription>
            Aprueba o rechaza antecedentes segun el checklist ASHRAE.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {providers.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <ShieldCheck className="size-8 text-success" />
              <p className="font-medium">No hay proveedores pendientes</p>
              <p className="text-sm text-muted-foreground">
                Todas las solicitudes fueron revisadas.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <caption className="sr-only">Proveedores pendientes de verificacion</caption>
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th scope="col" className="py-2 pr-4 font-medium">
                      Proveedor
                    </th>
                    <th scope="col" className="py-2 pr-4 font-medium">
                      RUT
                    </th>
                    <th scope="col" className="py-2 pr-4 font-medium">
                      Ubicacion
                    </th>
                    <th scope="col" className="py-2 pr-4 font-medium">
                      Segmento
                    </th>
                    <th scope="col" className="py-2 pr-4 font-medium">
                      Estado
                    </th>
                    <th scope="col" className="py-2 font-medium">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map((provider, index) => {
                    const resolved = !isPending(provider.verificationStatus);
                    return (
                      <motion.tr
                        key={provider.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2, delay: index * 0.03 }}
                        className="border-b border-border/60 last:border-0"
                      >
                        <td className="py-3 pr-4">
                          <p className="font-medium text-foreground">{provider.legalName}</p>
                          <p className="text-xs text-muted-foreground">{provider.email}</p>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {formatRut(provider.rut)}
                        </td>
                        <td className="py-3 pr-4">
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <MapPin className="size-3.5" />
                            {provider.commune}
                          </span>
                        </td>
                        <td className="py-3 pr-4 capitalize text-muted-foreground">
                          {provider.segment}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={resolved ? "secondary" : "warning"}>
                            {STATUS_LABEL[provider.verificationStatus]}
                          </Badge>
                        </td>
                        <td className="py-3">
                          {resolved ? (
                            <span className="text-xs text-muted-foreground">Resuelto</span>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => decide(provider.id, "verificado")}
                              >
                                <Check className="size-4" />
                                Aprobar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setRejectTarget(provider);
                                  setNote("");
                                  setNoteError(null);
                                }}
                              >
                                <X className="size-4" />
                                Rechazar
                              </Button>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(rejectTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null);
            setNote("");
            setNoteError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar verificacion</DialogTitle>
            <DialogDescription>
              {rejectTarget ? `Indica el motivo para ${rejectTarget.legalName}.` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <label htmlFor="reject-note" className="text-sm font-medium">
              Motivo del rechazo
            </label>
            <Textarea
              id="reject-note"
              value={note}
              onChange={(event) => {
                setNote(event.target.value);
                setNoteError(null);
              }}
              aria-invalid={Boolean(noteError)}
              aria-describedby={noteError ? "reject-note-error" : undefined}
              placeholder="Documentacion incompleta, RUT no coincide..."
            />
            {noteError && (
              <p
                id="reject-note-error"
                role="alert"
                aria-live="polite"
                className="text-sm text-destructive"
              >
                {noteError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectTarget(null);
                setNote("");
                setNoteError(null);
              }}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Confirmar rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
