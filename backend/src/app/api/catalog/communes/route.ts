import { corsPreflight, handleErrors, jsonOk } from "@/lib/http";
import { listCommunes } from "@/services/provider-profile";

export function OPTIONS() {
  return corsPreflight();
}

export async function GET() {
  return handleErrors(async () => jsonOk(listCommunes()));
}
