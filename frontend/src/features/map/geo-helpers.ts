import type { GeoPoint, ProviderVerificationStatus, ServiceSegment } from "@hvac/shared";

/** Colores por segmento de servicio (tokens CSS o hex). */
export const SEGMENT_COLORS: Record<ServiceSegment, string> = {
  residencial: "var(--primary)",
  comercial: "var(--accent)",
  industrial: "#7c3aed",
};

/** Colores por estado de verificacion (tokens CSS). */
export const VERIFICATION_COLORS: Record<ProviderVerificationStatus, string> = {
  verificado: "var(--success)",
  en_revision: "var(--warning)",
  pendiente: "var(--muted-foreground)",
  rechazado: "var(--destructive)",
};

/** GeoJSON minimo (FeatureCollection con un Polygon) para el circulo de radio. */
export interface CircleFeatureCollection {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: Record<string, never>;
    geometry: { type: "Polygon"; coordinates: Array<Array<[number, number]>> };
  }>;
}

/** Resuelve un token CSS (`var(--x)`) a un color concreto para las capas del mapa. */
export function resolveCssColor(cssValue: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const match = /^var\((--[\w-]+)\)$/.exec(cssValue);
  if (!match) return cssValue;
  const resolved = getComputedStyle(document.documentElement).getPropertyValue(match[1]).trim();
  return resolved || fallback;
}

/** Iniciales de un nombre (hasta dos palabras). */
export function initials(name: string): string {
  const letters = name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
  return letters || "•";
}

/** Aproxima un circulo geodesico como poligono GeoJSON cerrado. */
export function buildCircle(
  center: GeoPoint,
  radiusKm: number,
  steps = 72,
): CircleFeatureCollection {
  const earthRadiusKm = 6371;
  const latRad = (center.lat * Math.PI) / 180;
  const deltaLat = (radiusKm / earthRadiusKm) * (180 / Math.PI);
  const deltaLng = deltaLat / Math.max(Math.cos(latRad), 0.01);
  const ring: [number, number][] = [];
  for (let i = 0; i < steps; i += 1) {
    const angle = (i / steps) * Math.PI * 2;
    ring.push([center.lng + deltaLng * Math.cos(angle), center.lat + deltaLat * Math.sin(angle)]);
  }
  ring.push(ring[0]);

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: { type: "Polygon", coordinates: [ring] },
      },
    ],
  };
}
