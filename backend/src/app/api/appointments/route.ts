import { appointmentCreateSchema } from "@hvac/shared";
import { corsPreflight, handleErrors, jsonOk, parseBody } from "@/lib/http";
import { createAppointment } from "@/services/appointments";

export function OPTIONS() {
  return corsPreflight();
}

export async function POST(req: Request) {
  return handleErrors(async () => {
    const input = await parseBody(appointmentCreateSchema, req);
    const appointment = await createAppointment(input);
    return jsonOk(appointment, { status: 201 });
  });
}
