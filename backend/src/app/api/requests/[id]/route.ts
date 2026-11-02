import { serviceRequestUpdateSchema } from "@hvac/shared";
import { corsPreflight, handleErrors, jsonOk, parseBody } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { getRequestDetail, transitionRequest } from "@/services/requests";

export function OPTIONS() {
  return corsPreflight();
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErrors(async () => {
    const user = await requireUser(req);
    const { id } = await params;
    const detail = await getRequestDetail(id, user);
    return jsonOk(detail);
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErrors(async () => {
    const user = await requireUser(req);
    const { id } = await params;
    const input = await parseBody(serviceRequestUpdateSchema, req);
    const request = await transitionRequest(id, input.status, user, input.note);
    return jsonOk(request);
  });
}
