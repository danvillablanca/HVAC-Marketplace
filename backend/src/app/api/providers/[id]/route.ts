import { corsPreflight, handleErrors, jsonError, jsonOk } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { getProviderForViewer } from "@/services/providers";

export function OPTIONS() {
  return corsPreflight();
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErrors(async () => {
    const { id } = await params;
    // Ruta publica: la sesion es opcional y solo decide si se muestra el contacto (RN-10).
    const viewer = req.headers.get("authorization")
      ? await requireUser(req).catch(() => null)
      : null;
    const provider = await getProviderForViewer(id, viewer);
    if (!provider) return jsonError("not_found", "Proveedor no encontrado", 404);
    return jsonOk(provider);
  });
}
