import { loginSchema } from "@hvac/shared";
import { corsPreflight, handleErrors, jsonOk, parseBody } from "@/lib/http";
import { login } from "@/services/auth-login";

export function OPTIONS() {
  return corsPreflight();
}

/** REQ-AUT-02: login con bloqueo temporal por intentos fallidos. */
export async function POST(req: Request) {
  return handleErrors(async () => {
    const input = await parseBody(loginSchema, req);
    const session = await login(input.email, input.password);
    return jsonOk(session);
  });
}
