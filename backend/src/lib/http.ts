import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import type { ApiError, ApiSuccess } from "@hvac/shared";
import { env } from "./env";

export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(code: string, message: string, status = 400, details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function withCors<T>(res: NextResponse<T>): NextResponse<T> {
  res.headers.set("Access-Control-Allow-Origin", env.frontendOrigin);
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Max-Age", "86400");
  res.headers.set("Vary", "Origin");
  return res;
}

export function corsPreflight(): NextResponse {
  return withCors(new NextResponse(null, { status: 204 }));
}

export function jsonOk<T>(data: T, init?: ResponseInit): NextResponse<ApiSuccess<T>> {
  return withCors(NextResponse.json<ApiSuccess<T>>({ ok: true, data }, init));
}

export function jsonError(
  code: string,
  message: string,
  status = 400,
  details?: unknown,
): NextResponse<ApiError> {
  return withCors(
    NextResponse.json<ApiError>({ ok: false, error: { code, message, details } }, { status }),
  );
}

export async function parseBody<S extends z.ZodTypeAny>(
  schema: S,
  req: Request,
): Promise<z.infer<S>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError("invalid_json", "El cuerpo de la solicitud no es JSON válido", 400);
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new HttpError("validation_error", "Datos inválidos", 422, result.error.flatten());
  }
  return result.data;
}

export function parseQuery<S extends z.ZodTypeAny>(schema: S, req: Request): z.infer<S> {
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const result = schema.safeParse(params);
  if (!result.success) {
    throw new HttpError("validation_error", "Parámetros inválidos", 422, result.error.flatten());
  }
  return result.data;
}

export async function handleErrors(handler: () => Promise<Response>): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonError(error.code, error.message, error.status, error.details);
    }
    if (error instanceof ZodError) {
      return jsonError("validation_error", "Datos inválidos", 422, error.flatten());
    }
    console.error("[api] error inesperado", error);
    return jsonError("internal_error", "Error interno del servidor", 500);
  }
}
