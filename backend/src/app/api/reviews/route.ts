import { reviewCreateSchema } from "@hvac/shared";
import { corsPreflight, handleErrors, jsonOk, parseBody } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { createReview } from "@/services/reviews";

export function OPTIONS() {
  return corsPreflight();
}

export async function POST(req: Request) {
  return handleErrors(async () => {
    const user = await requireUser(req);
    const input = await parseBody(reviewCreateSchema, req);
    const review = await createReview(input, user.id);
    return jsonOk(review, { status: 201 });
  });
}
