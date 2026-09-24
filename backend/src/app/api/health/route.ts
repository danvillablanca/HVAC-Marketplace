import { corsPreflight, handleErrors, jsonOk } from "@/lib/http";
import { hasSupabase } from "@/lib/env";

export function OPTIONS() {
  return corsPreflight();
}

export async function GET() {
  return handleErrors(async () => jsonOk({ status: "ok", supabase: hasSupabase }));
}
