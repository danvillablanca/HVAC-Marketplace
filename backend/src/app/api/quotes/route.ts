import { quoteCreateSchema } from "@hvac/shared";
import { corsPreflight, handleErrors, jsonOk, parseBody } from "@/lib/http";
import { requireRole } from "@/lib/auth";
import { createQuote } from "@/services/requests";

export function OPTIONS() {
  return corsPreflight();
}

export async function POST(req: Request) {
  return handleErrors(async () => {
    // Solo proveedores pueden cotizar
    const user = await requireRole(req, ["proveedor"]);
    const input = await parseBody(quoteCreateSchema, req);
    const quote = await createQuote(input, user);
    return jsonOk(quote, { status: 201 });
  });
}
