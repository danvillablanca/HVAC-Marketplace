import { corsPreflight, handleErrors, jsonError, jsonOk } from "@/lib/http";
import { getProvider } from "@/services/providers";

export function OPTIONS() {
  return corsPreflight();
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErrors(async () => {
    const { id } = await params;
    const provider = await getProvider(id);
    if (!provider) return jsonError("not_found", "Proveedor no encontrado", 404);
    return jsonOk(provider);
  });
}
