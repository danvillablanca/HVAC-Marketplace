import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateQuote } from "./hooks";

interface QuoteFormProps {
  requestId: string;
  onSuccess?: () => void;
}

export function QuoteForm({ requestId, onSuccess }: QuoteFormProps) {
  const [amount, setAmount] = useState("");
  const [includesIva, setIncludesIva] = useState(true);
  const [scope, setScope] = useState("");
  const [deadlineDays, setDeadlineDays] = useState("7");
  const [validDays, setValidDays] = useState("15");
  const [error, setError] = useState<string | null>(null);

  const createQuote = useCreateQuote();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const amountNum = parseInt(amount, 10);
    if (!amountNum || amountNum <= 0) {
      setError("El monto debe ser mayor a $0.");
      return;
    }
    if (scope.trim().length < 20) {
      setError("El alcance debe tener al menos 20 caracteres.");
      return;
    }

    try {
      await createQuote.mutateAsync({
        requestId,
        amount: amountNum,
        includesIva,
        scope: scope.trim(),
        deadlineDays: parseInt(deadlineDays, 10) || 7,
        validDays: parseInt(validDays, 10) || 15,
      });
      onSuccess?.();
    } catch (err: any) {
      setError(err.message ?? "Error al enviar la cotización.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enviar cotización</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto (CLP)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="250000"
                min={1}
                required
              />
            </div>
            <div className="flex items-end gap-2 space-y-2">
              <div className="flex items-center gap-2">
                <Switch id="iva" checked={includesIva} onCheckedChange={setIncludesIva} />
                <Label htmlFor="iva">IVA incluido</Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scope">Alcance del trabajo</Label>
            <Textarea
              id="scope"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              placeholder="Describe qué incluye tu cotización (mínimo 20 caracteres)..."
              rows={3}
              required
              minLength={20}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="deadline">Plazo de ejecución (días)</Label>
              <Input
                id="deadline"
                type="number"
                value={deadlineDays}
                onChange={(e) => setDeadlineDays(e.target.value)}
                min={1}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valid">Validez de la cotización (días)</Label>
              <Input
                id="valid"
                type="number"
                value={validDays}
                onChange={(e) => setValidDays(e.target.value)}
                min={1}
                max={30}
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={createQuote.isPending}>
            {createQuote.isPending ? "Enviando..." : "Enviar cotización"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
