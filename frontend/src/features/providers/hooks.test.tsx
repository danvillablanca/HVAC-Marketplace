import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, createTestQueryClient, renderHook, waitFor } from "@/test/render";
import type {
  LeadCreateInput,
  NearbySearchInput,
  ProviderSummary,
  Review,
  ReviewCreateInput,
} from "@hvac/shared";
import { DEMO_REVIEWS } from "@/data/providers";
import {
  useCreateLead,
  useCreateReview,
  useNearbyProviders,
  useProvider,
  useProviderReviews,
} from "./hooks";

function okResponse<T>(data: T) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ ok: true, data }),
  } as unknown as Response;
}

function useStubbedFetch(
  impl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
) {
  const fetchMock = vi.fn(impl);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderHookWithClient<T>(hook: () => T) {
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(hook, { wrapper });
}

function makeSummary(overrides: Partial<ProviderSummary> = {}): ProviderSummary {
  return {
    id: "api-1",
    legalName: "API Uno",
    slug: "api-1",
    segment: "residencial",
    verificationStatus: "verificado",
    ratingAvg: 4.5,
    reviewsCount: 10,
    city: "Santiago",
    commune: "Santiago",
    distanceMeters: 1200,
    location: { lat: -33.44, lng: -70.65 },
    services: ["Instalacion split"],
    priceFrom: 89990,
    isDemo: false,
    ...overrides,
  };
}

const santiagoInput: NearbySearchInput = {
  lat: -33.44,
  lng: -70.65,
  radiusKm: 20,
  limit: 20,
  offset: 0,
};

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useNearbyProviders", () => {
  it("devuelve los datos de la API y construye los parametros de busqueda", async () => {
    const apiProviders = [makeSummary({ id: "api-1" }), makeSummary({ id: "api-2" })];
    const fetchMock = useStubbedFetch(async () => okResponse(apiProviders));

    const input: NearbySearchInput = { ...santiagoInput, segment: "industrial", query: "split" };
    const { result } = renderHookWithClient(() => useNearbyProviders(input));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(apiProviders);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain("/api/providers/search");
    expect(url).toContain("lat=-33.44");
    expect(url).toContain("radiusKm=20");
    expect(url).toContain("segment=industrial");
    expect(url).toContain("query=split");
  });

  it("usa el fallback demo filtrando por radio", async () => {
    useStubbedFetch(async () => {
      throw new Error("network down");
    });

    const { result } = renderHookWithClient(() =>
      useNearbyProviders({ ...santiagoInput, radiusKm: 20 }),
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const data = result.current.data ?? [];
    expect(data.length).toBeGreaterThan(0);
    for (const provider of data) {
      expect(provider.distanceMeters).not.toBeNull();
      expect(provider.distanceMeters as number).toBeLessThanOrEqual(20_000);
      expect(provider.isDemo).toBe(true);
    }
    const distances = data.map((provider) => provider.distanceMeters ?? 0);
    expect([...distances].sort((a, b) => a - b)).toEqual(distances);
  });

  it("filtra el fallback demo por segmento", async () => {
    useStubbedFetch(async () => {
      throw new Error("network down");
    });

    const { result } = renderHookWithClient(() =>
      useNearbyProviders({ ...santiagoInput, segment: "industrial" }),
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const data = result.current.data ?? [];
    expect(data.length).toBeGreaterThan(0);
    for (const provider of data) expect(provider.segment).toBe("industrial");
  });

  it("filtra el fallback demo por query y respeta el limit", async () => {
    useStubbedFetch(async () => {
      throw new Error("network down");
    });

    const { result } = renderHookWithClient(() =>
      useNearbyProviders({ ...santiagoInput, query: "split" }),
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const data = result.current.data ?? [];
    expect(data).toHaveLength(1);
    expect(data[0]?.legalName).toContain("Hogar Fresco");

    const { result: limited } = renderHookWithClient(() =>
      useNearbyProviders({ ...santiagoInput, limit: 2 }),
    );
    await waitFor(() => expect(limited.current.isSuccess).toBe(true));
    expect(limited.current.data).toHaveLength(2);
  });

  it("no consulta cuando el input es null", () => {
    const fetchMock = useStubbedFetch(async () => okResponse([]));
    const { result } = renderHookWithClient(() => useNearbyProviders(null));
    expect(result.current.fetchStatus).toBe("idle");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("useProvider", () => {
  it("devuelve el detalle de la API", async () => {
    const detail = makeSummary({ id: "p-x", legalName: "Proveedor API" });
    useStubbedFetch(async () => okResponse(detail));

    const { result } = renderHookWithClient(() => useProvider("p-x"));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(detail);
  });

  it("hace fallback al proveedor demo si falla la red", async () => {
    useStubbedFetch(async () => {
      throw new Error("network down");
    });

    const { result } = renderHookWithClient(() => useProvider("p-clima-andes"));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.legalName).toBe("Clima Andes SpA");
    expect(result.current.data?.isDemo).toBe(true);
  });

  it("devuelve null si el id no existe en los datos demo", async () => {
    useStubbedFetch(async () => {
      throw new Error("network down");
    });

    const { result } = renderHookWithClient(() => useProvider("p-no-existe"));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });
});

describe("useProviderReviews", () => {
  it("devuelve las resenas de la API", async () => {
    const reviews = DEMO_REVIEWS["p-clima-andes"] as Review[];
    useStubbedFetch(async () => okResponse(reviews));

    const { result } = renderHookWithClient(() => useProviderReviews("p-clima-andes"));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(reviews);
  });

  it("hace fallback a las resenas demo y devuelve [] para desconocidos", async () => {
    useStubbedFetch(async () => {
      throw new Error("network down");
    });

    const { result } = renderHookWithClient(() => useProviderReviews("p-clima-andes"));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);

    const { result: unknown } = renderHookWithClient(() => useProviderReviews("p-desconocido"));
    await waitFor(() => expect(unknown.current.isSuccess).toBe(true));
    expect(unknown.current.data).toEqual([]);
  });
});

describe("useCreateLead", () => {
  const input: LeadCreateInput = {
    providerId: "p-clima-andes",
    description: "Necesito instalar un split en mi oficina",
    urgency: "alta",
    preferredContact: "whatsapp",
  };

  it("publica el lead en la API", async () => {
    const fetchMock = useStubbedFetch(async () => okResponse({ id: "lead-1" }));
    const { result } = renderHookWithClient(() => useCreateLead());

    await act(async () => {
      await result.current.mutateAsync(input);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toContain("/api/leads");
    expect((init as RequestInit).method).toBe("POST");
    expect(JSON.parse(String((init as RequestInit).body))).toEqual(input);
  });

  it("expone el error cuando la API falla", async () => {
    useStubbedFetch(async () => {
      throw new Error("network down");
    });
    const { result } = renderHookWithClient(() => useCreateLead());

    await act(async () => {
      await expect(result.current.mutateAsync(input)).rejects.toThrow();
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useCreateReview", () => {
  const input: ReviewCreateInput = { providerId: "p-clima-andes", rating: 5, comment: "Excelente" };

  it("publica la resena en la API", async () => {
    const created: Review = {
      id: "r-new",
      providerId: "p-clima-andes",
      rating: 5,
      comment: "Excelente",
      authorName: "Yo",
      createdAt: "2026-09-01T00:00:00.000Z",
      verified: false,
    };
    const fetchMock = useStubbedFetch(async () => okResponse(created));
    const { result } = renderHookWithClient(() => useCreateReview());

    await act(async () => {
      await result.current.mutateAsync(input);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toContain("/api/reviews");
    expect((init as RequestInit).method).toBe("POST");
    expect(JSON.parse(String((init as RequestInit).body))).toEqual(input);
  });
});
