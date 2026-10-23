import { leadCreateSchema } from "@hvac/shared";
import { corsPreflight, handleErrors, jsonOk, parseBody } from "@/lib/http";
import { createLead, listLeads } from "@/services/leads";

export function OPTIONS() {
  return corsPreflight();
}

export async function GET() {
  return handleErrors(async () => {
    const leads = await listLeads();
    return jsonOk(leads);
  });
}

export async function POST(req: Request) {
  return handleErrors(async () => {
    const input = await parseBody(leadCreateSchema, req);
    const lead = await createLead(input);
    return jsonOk(lead, { status: 201 });
  });
}
