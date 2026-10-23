/** Formato de moneda chilena (CLP, sin decimales). */
export function formatCLP(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "—";
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Normaliza un telefono chileno a formato +56XXXXXXXXX. */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("56")) return `+${digits}`;
  if (digits.length === 9) return `+56${digits}`;
  return `+${digits}`;
}

/** Formatea un telefono chileno para mostrar: +56 9 1234 5678. */
export function formatPhone(input: string): string {
  const normalized = normalizePhone(input);
  const match = normalized.match(/^\+56(\d)(\d{4})(\d{4})$/);
  if (!match) return normalized;
  return `+56 ${match[1]} ${match[2]} ${match[3]}`;
}

/** Formatea una distancia en metros a texto legible. */
export function formatDistance(meters: number | null | undefined): string {
  if (meters === null || meters === undefined) return "—";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/** Formatea una fecha ISO a dd-mm-aaaa (hora local). */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
