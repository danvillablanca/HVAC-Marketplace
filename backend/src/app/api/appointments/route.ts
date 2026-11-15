import { appointmentCreateSchema } from "@hvac/shared";
import { corsPreflight, handleErrors, jsonOk, parseBody } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { createAppointment } from "@/services/appointments";

export function OPTIONS() {
  return corsPreflight();
}

export async function POST(req: Request) {
  return handleErrors(async () => {
    const user = await requireUser(req);
    const input = await parseBody(appointmentCreateSchema, req);
    const appointment = await createAppointment(input, user.id);
    return jsonOk(appointment, { status: 201 });
  });
}
