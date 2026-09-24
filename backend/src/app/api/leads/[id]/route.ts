import { leadUpdateSchema } from "@hvac/shared";
import { corsPreflight, handleErrors, jsonOk, parseBody } from "@/lib/http";
import { updateLead } from "@/services/leads";

export function OPTIONS() {
  return corsPreflight();
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErrors(async () => {
    const { id } = await params;
    const input = await parseBody(leadUpdateSchema, req);
    const lead = await updateLead(id, input);
    return jsonOk(lead);
  });
}
