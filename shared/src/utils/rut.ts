/**
 * Utilidades para RUT chileno (modulo 11).
 */

/** Elimina puntos y guiones, deja solo digitos y un posible K final, en mayusculas. */
export function normalizeRut(input: string): string {
  const clean = input.replace(/[^0-9kK]/g, "").toUpperCase();
  if (clean.length < 2) return clean;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  return `${body}${dv}`;
}

/** Calcula el digito verificador a partir del cuerpo numerico. */
export function computeRutDv(body: string | number): string {
  const digits = String(body).replace(/\D/g, "");
  let sum = 0;
  let multiplier = 2;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    sum += Number(digits[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const remainder = 11 - (sum % 11);
  if (remainder === 11) return "0";
  if (remainder === 10) return "K";
  return String(remainder);
}

/** Valida un RUT chileno (acepta con o sin puntos/guion). */
export function isValidRut(input: string): boolean {
  const rut = normalizeRut(input);
  if (rut.length < 2) return false;
  const body = rut.slice(0, -1);
  const dv = rut.slice(-1);
  if (!/^\d+$/.test(body)) return false;
  return computeRutDv(body) === dv;
}

/** Formatea un RUT al estilo 12.345.678-5. */
export function formatRut(input: string): string {
  const rut = normalizeRut(input);
  if (rut.length < 2) return rut;
  const body = rut.slice(0, -1);
  const dv = rut.slice(-1);
  const withDots = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${withDots}-${dv}`;
}
