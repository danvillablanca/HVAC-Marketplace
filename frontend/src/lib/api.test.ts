import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import { apiFetch, ApiRequestError } from "./api";
import { env } from "./env";

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: vi.fn(async () => body),
  } as unknown as Response;
}

describe("lib/api", () => {
  let fetchMock: Mock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("apiFetch", () => {
    describe("éxito", () => {
      it("desempaqueta el envelope { ok: true } y devuelve data", async () => {
        fetchMock.mockResolvedValue(jsonResponse({ ok: true, data: { id: 1, name: "Ana" } }));

        const data = await apiFetch<{ id: number; name: string }>("/providers/1");

        expect(data).toEqual({ id: 1, name: "Ana" });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(
          `${env.apiBaseUrl}/providers/1`,
          expect.objectContaining({ method: "GET" }),
        );
      });

      it("añade Accept y no Content-Type ni body en GET sin cuerpo", async () => {
        fetchMock.mockResolvedValue(jsonResponse({ ok: true, data: null }));

        await apiFetch("/ping");

        const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        const headers = init.headers as Record<string, string>;
        expect(headers.Accept).toBe("application/json");
        expect(headers["Content-Type"]).toBeUndefined();
        expect(init.body).toBeUndefined();
      });

      it("serializa el body a JSON y define Content-Type en POST", async () => {
        fetchMock.mockResolvedValue(jsonResponse({ ok: true, data: { created: true } }));

        await apiFetch("/leads", { method: "POST", body: { providerId: "p1" } });

        const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        const headers = init.headers as Record<string, string>;
        expect(init.method).toBe("POST");
        expect(headers["Content-Type"]).toBe("application/json");
        expect(init.body).toBe(JSON.stringify({ providerId: "p1" }));
      });

      it("propaga el AbortSignal al fetch", async () => {
        fetchMock.mockResolvedValue(jsonResponse({ ok: true, data: null }));
        const controller = new AbortController();

        await apiFetch("/slow", { signal: controller.signal });

        const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(init.signal).toBe(controller.signal);
      });
    });

    describe("Authorization", () => {
      it("envía Bearer token cuando se entrega token", async () => {
        fetchMock.mockResolvedValue(jsonResponse({ ok: true, data: null }));

        await apiFetch("/me", { token: "jwt-token" });

        const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        const headers = init.headers as Record<string, string>;
        expect(headers.Authorization).toBe("Bearer jwt-token");
      });

      it("no envía Authorization sin token", async () => {
        fetchMock.mockResolvedValue(jsonResponse({ ok: true, data: null }));

        await apiFetch("/public", { token: null });

        const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        const headers = init.headers as Record<string, string>;
        expect(headers.Authorization).toBeUndefined();
      });
    });

    describe("errores", () => {
      it("lanza ApiRequestError con code/status/details del envelope de error", async () => {
        fetchMock.mockResolvedValue(
          jsonResponse(
            {
              ok: false,
              error: { code: "not_found", message: "Proveedor no existe", details: { id: "x" } },
            },
            { ok: false, status: 404 },
          ),
        );

        const error = (await apiFetch("/providers/x").catch((e) => e)) as ApiRequestError;

        expect(error).toBeInstanceOf(ApiRequestError);
        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe("ApiRequestError");
        expect(error.code).toBe("not_found");
        expect(error.status).toBe(404);
        expect(error.message).toBe("Proveedor no existe");
        expect(error.details).toEqual({ id: "x" });
      });

      it("lanza con mensaje genérico cuando HTTP no es ok pero el payload es ok:true", async () => {
        fetchMock.mockResolvedValue(
          jsonResponse({ ok: true, data: {} }, { ok: false, status: 500 }),
        );

        const error = (await apiFetch("/boom").catch((e) => e)) as ApiRequestError;

        expect(error).toBeInstanceOf(ApiRequestError);
        expect(error.code).toBe("unknown_error");
        expect(error.status).toBe(500);
        expect(error.message).toBe("Error 500");
      });

      it("lanza ApiRequestError cuando la respuesta no es JSON", async () => {
        const response = {
          ok: false,
          status: 502,
          json: vi.fn(async () => {
            throw new SyntaxError("Unexpected token <");
          }),
        } as unknown as Response;
        fetchMock.mockResolvedValue(response);

        const error = (await apiFetch("/gateway").catch((e) => e)) as ApiRequestError;

        expect(error).toBeInstanceOf(ApiRequestError);
        expect(error.code).toBe("unknown_error");
        expect(error.status).toBe(502);
      });

      it("lanza si el fetch rechaza (error de red)", async () => {
        fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

        await expect(apiFetch("/offline")).rejects.toThrow("Failed to fetch");
      });
    });
  });
});
