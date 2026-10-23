import { nearbySearchSchema } from "@hvac/shared";
import { corsPreflight, handleErrors, jsonOk, parseQuery } from "@/lib/http";
import { searchNearby } from "@/services/providers";

export function OPTIONS() {
  return corsPreflight();
}

export async function GET(req: Request) {
  return handleErrors(async () => {
    const input = parseQuery(nearbySearchSchema, req);
    const providers = await searchNearby(input);
    return jsonOk(providers);
  });
}
