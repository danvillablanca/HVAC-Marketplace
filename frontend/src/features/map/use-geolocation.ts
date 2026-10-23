import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_MAP_CENTER, type GeoPoint } from "@hvac/shared";

export type GeolocationStatus = "idle" | "loading" | "granted" | "denied";

export interface UseGeolocationResult {
  /** Coordenadas actuales o el centro por defecto si aun no hay permiso. */
  coords: GeoPoint;
  status: GeolocationStatus;
  error: string | null;
  /** `true` cuando `coords` corresponde al centro por defecto del mapa. */
  isFallback: boolean;
  request: () => void;
}

interface UseGeolocationOptions {
  /** Solicita la ubicacion al montar (por defecto `true`). */
  auto?: boolean;
}

/**
 * Geolocalizacion del navegador con degradacion elegante:
 * si el permiso se deniega o no esta disponible, devuelve `DEFAULT_MAP_CENTER`.
 */
export function useGeolocation({ auto = true }: UseGeolocationOptions = {}): UseGeolocationResult {
  const [coords, setCoords] = useState<GeoPoint>(DEFAULT_MAP_CENTER);
  const [status, setStatus] = useState<GeolocationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(true);
  const mountedRef = useRef(true);

  const request = useCallback(() => {
    setError(null);

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("denied");
      setError("La geolocalizacion no esta disponible en este navegador.");
      setCoords(DEFAULT_MAP_CENTER);
      setIsFallback(true);
      return;
    }

    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!mountedRef.current) return;
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setStatus("granted");
        setIsFallback(false);
      },
      (positionError) => {
        if (!mountedRef.current) return;
        setStatus("denied");
        setError(
          positionError.code === positionError.PERMISSION_DENIED
            ? "Permiso de ubicacion denegado. Usa una comuna o ciudad."
            : "No pudimos obtener tu ubicacion. Usa una comuna o ciudad.",
        );
        setCoords(DEFAULT_MAP_CENTER);
        setIsFallback(true);
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (auto) request();
    return () => {
      mountedRef.current = false;
    };
  }, [auto, request]);

  return { coords, status, error, isFallback, request };
}
