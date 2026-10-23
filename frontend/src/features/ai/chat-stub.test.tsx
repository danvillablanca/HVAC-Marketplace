import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderWithProviders, screen, waitFor, userEvent } from "@/test/render";
import { ChatStub } from "./chat-stub";

const fetchMock = vi.fn();

function okResponse(data: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => ({ ok: true, data }),
  } as unknown as Response;
}

beforeEach(() => {
  window.localStorage.clear();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ChatStub", () => {
  it("envia el mensaje a /api/ai/chat y muestra la respuesta del backend", async () => {
    fetchMock.mockResolvedValue(okResponse({ reply: "Te recomiendo Clima Andes." }));
    const user = userEvent.setup();
    renderWithProviders(<ChatStub />, { route: "/chat" });

    await user.type(screen.getByLabelText("Escribe tu consulta"), "Hola");
    await user.click(screen.getByRole("button", { name: "Enviar mensaje" }));

    expect(await screen.findByText("Te recomiendo Clima Andes.")).toBeInTheDocument();
    expect(screen.getByText("Hola")).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toContain("/api/ai/chat");
    expect((init as RequestInit).method).toBe("POST");
    expect(JSON.parse(String((init as RequestInit).body))).toEqual({ message: "Hola" });
  });

  it("usa el fallback local cuando la peticion falla", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    const user = userEvent.setup();
    renderWithProviders(<ChatStub />);

    await user.type(screen.getByLabelText("Escribe tu consulta"), "Necesito ayuda");
    await user.click(screen.getByRole("button", { name: "Enviar mensaje" }));

    expect(
      await screen.findByText(/El asistente IA estara disponible en E2\/E3/),
    ).toBeInTheDocument();
  });

  it("acepta variantes de respuesta (message/answer) y sugerencias", async () => {
    fetchMock.mockResolvedValue(okResponse({ message: "Respuesta desde message" }));
    const user = userEvent.setup();
    renderWithProviders(<ChatStub suggestions={["Ver proveedores split"]} />);

    await user.click(screen.getByRole("button", { name: /Ver proveedores split/ }));

    expect(await screen.findByText("Respuesta desde message")).toBeInTheDocument();
  });

  it("limpia el input y deshabilita el envio mientras espera", async () => {
    let resolveRequest: (value: Response) => void = () => {};
    fetchMock.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const user = userEvent.setup();
    renderWithProviders(<ChatStub />);

    const input = screen.getByLabelText("Escribe tu consulta");
    await user.type(input, "Consulta lenta");
    await user.click(screen.getByRole("button", { name: "Enviar mensaje" }));

    await waitFor(() => expect(screen.getByText("Escribiendo...")).toBeInTheDocument());
    expect(input).toHaveValue("");

    resolveRequest(okResponse({ reply: "Listo" }));
    expect(await screen.findByText("Listo")).toBeInTheDocument();
  });
});
