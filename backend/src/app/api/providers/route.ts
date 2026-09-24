import { SERVICE_SEGMENTS } from "@hvac/shared";
import { z } from "zod";
import { corsPreflight, handleErrors, jsonOk, parseQuery } from "@/lib/http";
import { listProviders } from "@/services/providers";

const listProvidersSchema = z.object({
  segment: z.enum(SERVICE_SEGMENTS).optional(),
  query: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export function OPTIONS() {
  return corsPreflight();
}

export async function GET(req: Request) {
  return handleErrors(async () => {
    const input = parseQuery(listProvidersSchema, req);
    const result = await listProviders(input);
    return jsonOk(result);
  });
}
