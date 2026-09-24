import { chatSchema } from "@hvac/shared";
import { corsPreflight, handleErrors, jsonOk, parseBody } from "@/lib/http";
import { answerQuestion } from "@/services/ai";

export function OPTIONS() {
  return corsPreflight();
}

export async function POST(req: Request) {
  return handleErrors(async () => {
    const input = await parseBody(chatSchema, req);
    const answer = await answerQuestion(input);
    return jsonOk(answer);
  });
}
