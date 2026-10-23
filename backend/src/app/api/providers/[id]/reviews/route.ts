import { corsPreflight, handleErrors, jsonOk } from "@/lib/http";
import { listReviews } from "@/services/providers";

export function OPTIONS() {
  return corsPreflight();
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErrors(async () => {
    const { id } = await params;
    const reviews = await listReviews(id);
    return jsonOk(reviews);
  });
}
