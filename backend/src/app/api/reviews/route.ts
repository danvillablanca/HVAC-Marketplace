import { reviewCreateSchema } from "@hvac/shared";
import { corsPreflight, handleErrors, jsonOk, parseBody } from "@/lib/http";
import { createReview } from "@/services/reviews";

export function OPTIONS() {
  return corsPreflight();
}

export async function POST(req: Request) {
  return handleErrors(async () => {
    const input = await parseBody(reviewCreateSchema, req);
    const review = await createReview(input);
    return jsonOk(review, { status: 201 });
  });
}
