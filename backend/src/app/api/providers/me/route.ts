import { providerProfileSchema } from "@hvac/shared";
import { corsPreflight, handleErrors, jsonOk, parseBody } from "@/lib/http";
import { requireRole } from "@/lib/auth";
import { getMyProfile, saveMyProfile } from "@/services/provider-profile";

export function OPTIONS() {
  return corsPreflight();
}

/** Perfil del proveedor autenticado (null si aun no lo completa). */
export async function GET(req: Request) {
  return handleErrors(async () => {
    const user = await requireRole(req, ["proveedor"]);
    return jsonOk(await getMyProfile(user.id));
  });
}

/** REQ-PRO-01/02/03/06: crea o actualiza el perfil y sus servicios. */
export async function PUT(req: Request) {
  return handleErrors(async () => {
    const user = await requireRole(req, ["proveedor"]);
    const input = await parseBody(providerProfileSchema, req);
    return jsonOk(await saveMyProfile(user.id, input));
  });
}
