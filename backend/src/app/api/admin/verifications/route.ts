import { verificationDecisionSchema } from "@hvac/shared";
import { corsPreflight, handleErrors, jsonOk, parseBody } from "@/lib/http";
import { decideVerification, listPendingVerifications } from "@/services/verification";

export function OPTIONS() {
  return corsPreflight();
}

export async function GET() {
  return handleErrors(async () => {
    const pending = await listPendingVerifications();
    return jsonOk(pending);
  });
}

export async function PATCH(req: Request) {
  return handleErrors(async () => {
    const input = await parseBody(verificationDecisionSchema, req);
    const result = await decideVerification(input);
    return jsonOk(result);
  });
}
