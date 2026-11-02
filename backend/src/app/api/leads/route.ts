import { leadCreateSchema } from "@hvac/shared";
import { corsPreflight, handleErrors, jsonOk, parseBody } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { createLead, listLeads } from "@/services/leads";

export function OPTIONS() {
  return corsPreflight();
}

export async function GET(req: Request) {
  return handleErrors(async () => {
    const user = await requireUser(req);
    const leads = await listLeads(user.id, user.role);
    return jsonOk(leads);
  });
}

export async function POST(req: Request) {
  return handleErrors(async () => {
    const user = await requireUser(req);
    const input = await parseBody(leadCreateSchema, req);
    const lead = await createLead(input, user.id);
    return jsonOk(lead, { status: 201 });
  });
}
