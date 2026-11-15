import { verificationDecisionSchema } from "@hvac/shared";
import { corsPreflight, handleErrors, jsonOk, parseBody } from "@/lib/http";
import { requireRole } from "@/lib/auth";
import { decideVerification, listPendingVerifications } from "@/services/verification";

export function OPTIONS() {
  return corsPreflight();
}

export async function GET(req: Request) {
  return handleErrors(async () => {
    const user = await requireRole(req, ["admin"]);
    const pending = await listPendingVerifications();
    return jsonOk(pending);
  });
}

export async function PATCH(req: Request) {
  return handleErrors(async () => {
    const user = await requireRole(req, ["admin"]);
    const input = await parseBody(verificationDecisionSchema, req);
    const result = await decideVerification(input, user.id);
    return jsonOk(result);
  });
}
