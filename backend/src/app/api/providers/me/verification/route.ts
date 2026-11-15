import { verificationRequestSchema } from "@hvac/shared";
import { corsPreflight, handleErrors, jsonOk, parseBody } from "@/lib/http";
import { requireRole } from "@/lib/auth";
import { requestVerification } from "@/services/provider-profile";

export function OPTIONS() {
  return corsPreflight();
}

/** REQ-VER-01 (version simple): envia el perfil a revision del admin. */
export async function POST(req: Request) {
  return handleErrors(async () => {
    const user = await requireRole(req, ["proveedor"]);
    const input = await parseBody(verificationRequestSchema, req);
    return jsonOk(await requestVerification(user.id, input));
  });
}
