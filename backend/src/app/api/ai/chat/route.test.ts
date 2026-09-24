import { describe, expect, it } from "vitest";
import { jsonRequest } from "@/test/http";
import { OPTIONS, POST } from "./route";

describe("POST /api/ai/chat", () => {
  it("responde con el stub cuando no hay GEMINI_API_KEY", async () => {
    const res = await POST(
      jsonRequest("POST", "/api/ai/chat", { message: "¿Qué proveedores hay en Santiago?" }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.stub).toBe(true);
    expect(body.data.answer).toBeTruthy();
    expect(Array.isArray(body.data.sources)).toBe(true);
    expect(body.data.sources).toHaveLength(0);
  });

  it("rechaza un mensaje vacío", async () => {
    const res = await POST(jsonRequest("POST", "/api/ai/chat", { message: "" }));

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error.code).toBe("validation_error");
  });

  it("OPTIONS responde 204 con CORS", () => {
    const res = OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:5173");
  });
});
