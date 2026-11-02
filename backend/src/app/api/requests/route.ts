import { serviceRequestCreateSchema } from "@hvac/shared";
import { corsPreflight, handleErrors, jsonOk, parseBody } from "@/lib/http";
import { requireRole, requireUser } from "@/lib/auth";
import { createRequest, listRequests } from "@/services/requests";

export function OPTIONS() {
  return corsPreflight();
}

export async function GET(req: Request) {
  return handleErrors(async () => {
    const user = await requireUser(req);
    const requests = await listRequests(user.id, user.role);
    return jsonOk(requests);
  });
}

export async function POST(req: Request) {
  return handleErrors(async () => {
    const user = await requireRole(req, ["cliente"]);
    const input = await parseBody(serviceRequestCreateSchema, req);
    const request = await createRequest(input, user.id);
    return jsonOk(request, { status: 201 });
  });
}
