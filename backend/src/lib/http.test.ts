import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  HttpError,
  corsPreflight,
  handleErrors,
  jsonError,
  jsonOk,
  parseBody,
  parseQuery,
  withCors,
} from "./http";

const profileSchema = z.object({
  name: z.string().min(1),
});

const querySchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  limit: z.coerce.number().int().positive().default(10),
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("jsonOk", () => {
  it("envuelve los datos en ApiSuccess y aplica CORS", async () => {
    const res = jsonOk({ hello: "mundo" });

    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:5173");
    expect(res.headers.get("Vary")).toBe("Origin");
    await expect(res.json()).resolves.toEqual({ ok: true, data: { hello: "mundo" } });
  });

  it("respeta el status entregado en init", async () => {
    const res = jsonOk({ id: "x" }, { status: 201 });
    expect(res.status).toBe(201);
  });
});

describe("jsonError", () => {
  it("construye un ApiError con código, mensaje, status y detalles", async () => {
    const res = jsonError("not_found", "No existe", 404, { field: "id" });

    expect(res.status).toBe(404);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:5173");
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: { code: "not_found", message: "No existe", details: { field: "id" } },
    });
  });

  it("usa 400 por defecto", async () => {
    const res = jsonError("bad_request", "Mal");
    expect(res.status).toBe(400);
  });
});

describe("withCors / corsPreflight", () => {
  it("withCors agrega las cabeceras esperadas", () => {
    const res = jsonOk({});
    withCors(res);

    expect(res.headers.get("Access-Control-Allow-Methods")).toBe(
      "GET,POST,PATCH,PUT,DELETE,OPTIONS",
    );
    expect(res.headers.get("Access-Control-Allow-Headers")).toBe("Content-Type, Authorization");
    expect(res.headers.get("Access-Control-Max-Age")).toBe("86400");
  });

  it("corsPreflight responde 204 con CORS", () => {
    const res = corsPreflight();
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:5173");
  });
});

describe("parseBody", () => {
  it("devuelve los datos validados", async () => {
    const req = new Request("http://localhost/api", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Andes" }),
    });

    await expect(parseBody(profileSchema, req)).resolves.toEqual({ name: "Andes" });
  });

  it("lanza HttpError 400 si el cuerpo no es JSON válido", async () => {
    const req = new Request("http://localhost/api", {
      method: "POST",
      body: "{no-json",
    });

    const error = await parseBody(profileSchema, req).catch((err) => err);
    expect(error).toBeInstanceOf(HttpError);
    expect(error.status).toBe(400);
    expect(error.code).toBe("invalid_json");
  });

  it("lanza HttpError 422 si el schema no valida", async () => {
    const req = new Request("http://localhost/api", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "" }),
    });

    const error = await parseBody(profileSchema, req).catch((err) => err);
    expect(error).toBeInstanceOf(HttpError);
    expect(error.status).toBe(422);
    expect(error.code).toBe("validation_error");
    expect(error.details).toBeDefined();
  });
});

describe("parseQuery", () => {
  it("parsea y aplica defaults del schema", () => {
    const req = new Request("http://localhost/api?lat=-33.44&lng=-70.66");
    expect(parseQuery(querySchema, req)).toEqual({ lat: -33.44, lng: -70.66, limit: 10 });
  });

  it("lanza HttpError 422 si faltan parámetros", () => {
    const req = new Request("http://localhost/api?lat=-33.44");

    let error: unknown;
    try {
      parseQuery(querySchema, req);
    } catch (err) {
      error = err;
    }
    expect(error).toBeInstanceOf(HttpError);
    expect((error as HttpError).status).toBe(422);
    expect((error as HttpError).code).toBe("validation_error");
  });
});

describe("handleErrors", () => {
  it("mapea HttpError a su status y código", async () => {
    const res = await handleErrors(async () => {
      throw new HttpError("forbidden", "Sin permiso", 403, { role: "cliente" });
    });

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: { code: "forbidden", message: "Sin permiso", details: { role: "cliente" } },
    });
  });

  it("mapea ZodError a validation_error 422", async () => {
    const res = await handleErrors(async () => {
      profileSchema.parse({ name: "" });
      return jsonOk({});
    });

    expect(res.status).toBe(422);
    const body = (await res.json()) as { ok: boolean; error: { code: string } };
    expect(body.error.code).toBe("validation_error");
  });

  it("mapea errores desconocidos a internal_error 500", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await handleErrors(async () => {
      throw new Error("boom");
    });

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: { code: "internal_error", message: "Error interno del servidor" },
    });
    expect(spy).toHaveBeenCalled();
  });

  it("devuelve la respuesta del handler cuando no hay error", async () => {
    const res = await handleErrors(async () => jsonOk({ ok: true }, { status: 201 }));
    expect(res.status).toBe(201);
  });
});
