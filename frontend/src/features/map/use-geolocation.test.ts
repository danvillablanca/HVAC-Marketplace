import { describe, it, expect, vi, afterEach, type Mock } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { DEFAULT_MAP_CENTER } from "@hvac/shared";
import { useGeolocation } from "./use-geolocation";

type PositionCallback = (position: { coords: { latitude: number; longitude: number } }) => void;
type ErrorCallback = (error: { code: number; PERMISSION_DENIED: number }) => void;

function installGeolocation(impl: (success: PositionCallback, error: ErrorCallback) => void): Mock {
  const getCurrentPosition = vi.fn(impl);
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: { getCurrentPosition },
  });
  return getCurrentPosition;
}

afterEach(() => {
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: undefined,
  });
});

describe("useGeolocation", () => {
  it("empieza en fallback (centro por defecto) y solicita al montar", () => {
    const getCurrentPosition = installGeolocation(() => {});
    const { result } = renderHook(() => useGeolocation());

    expect(result.current.status).toBe("loading");
    expect(result.current.isFallback).toBe(true);
    expect(result.current.coords).toEqual(DEFAULT_MAP_CENTER);
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it("exito: status granted y coordenadas del navegador", async () => {
    installGeolocation((success) => {
      success({ coords: { latitude: -33.45, longitude: -70.66 } });
    });

    const { result } = renderHook(() => useGeolocation());

    await waitFor(() => expect(result.current.status).toBe("granted"));
    expect(result.current.coords).toEqual({ lat: -33.45, lng: -70.66 });
    expect(result.current.isFallback).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("error de permiso: status denied y fallback DEFAULT_MAP_CENTER", async () => {
    installGeolocation((_success, error) => {
      error({ code: 1, PERMISSION_DENIED: 1 });
    });

    const { result } = renderHook(() => useGeolocation());

    await waitFor(() => expect(result.current.status).toBe("denied"));
    expect(result.current.coords).toEqual(DEFAULT_MAP_CENTER);
    expect(result.current.isFallback).toBe(true);
    expect(result.current.error).toMatch(/denegado/i);
  });

  it("error no-permiso: mensaje generico y fallback", async () => {
    installGeolocation((_success, error) => {
      error({ code: 3, PERMISSION_DENIED: 1 });
    });

    const { result } = renderHook(() => useGeolocation());

    await waitFor(() => expect(result.current.status).toBe("denied"));
    expect(result.current.coords).toEqual(DEFAULT_MAP_CENTER);
    expect(result.current.error).toMatch(/No pudimos obtener/i);
  });

  it("sin soporte de geolocation: denied y fallback", async () => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: undefined,
    });

    const { result } = renderHook(() => useGeolocation());

    await waitFor(() => expect(result.current.status).toBe("denied"));
    expect(result.current.coords).toEqual(DEFAULT_MAP_CENTER);
    expect(result.current.error).toMatch(/no esta disponible/i);
  });
});
