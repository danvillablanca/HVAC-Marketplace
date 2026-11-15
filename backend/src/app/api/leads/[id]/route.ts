import { leadUpdateSchema } from "@hvac/shared";
import { corsPreflight, handleErrors, jsonOk, parseBody } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { updateLead } from "@/services/leads";

export function OPTIONS() {
  return corsPreflight();
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErrors(async () => {
    const user = await requireUser(req);
    const { id } = await params;
    const input = await parseBody(leadUpdateSchema, req);
    const lead = await updateLead(id, input, user.id, user.role);
    return jsonOk(lead);
  });
}
