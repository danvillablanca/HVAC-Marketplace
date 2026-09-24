import { appointmentUpdateSchema } from "@hvac/shared";
import { corsPreflight, handleErrors, jsonOk, parseBody } from "@/lib/http";
import { updateAppointment } from "@/services/appointments";

export function OPTIONS() {
  return corsPreflight();
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErrors(async () => {
    const { id } = await params;
    const input = await parseBody(appointmentUpdateSchema, req);
    const appointment = await updateAppointment(id, input);
    return jsonOk(appointment);
  });
}
