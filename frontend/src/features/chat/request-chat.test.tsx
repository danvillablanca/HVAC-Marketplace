import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen, userEvent, waitFor } from "@/test/render";
import { RequestChat } from "./request-chat";

const hooks = vi.hoisted(() => ({ send: vi.fn(), selected: [] as Array<string | null> }));

vi.mock("./hooks", () => ({
  threadsKey: () => [],
  messagesKey: () => [],
  useThreads: () => ({
    isLoading: false,
    isError: false,
    data: [
      {
        requestId: "r1",
        providerId: "prov-a",
        providerName: "Clima A",
        unread: 0,
        lastMessage: null,
        lastAt: null,
      },
      {
        requestId: "r1",
        providerId: "prov-b",
        providerName: "Clima B",
        unread: 2,
        lastMessage: "Hola",
        lastAt: null,
      },
    ],
  }),
  useMessages: (_r: string, providerId: string | null) => {
    hooks.selected.push(providerId);
    return {
      data:
        providerId === "prov-b"
          ? [
              {
                id: "m1",
                requestId: "r1",
                providerId: "prov-b",
                senderId: "x",
                mine: false,
                body: "Puedo ir mañana",
                readAt: null,
                createdAt: "2026-11-03T12:00:00Z",
              },
            ]
          : [],
    };
  },
  useSendMessage: () => ({ mutateAsync: hooks.send, isPending: false }),
}));

beforeEach(() => {
  hooks.send.mockReset().mockResolvedValue({});
  hooks.selected = [];
  window.localStorage.setItem(
    "hvac-auth-session",
    JSON.stringify({ id: "c1", email: "cliente@demo.cl", fullName: "Cliente", role: "cliente" }),
  );
});

describe("PR-028 RequestChat", () => {
  it("muestra un hilo por proveedor con sus no leídos y envía al proveedor elegido", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RequestChat requestId="r1" />);

    expect(screen.getByRole("tab", { name: /Clima A/ })).toBeInTheDocument();
    expect(screen.getByLabelText("2 sin leer")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /Clima B/ }));
    expect(await screen.findByText("Puedo ir mañana")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Escribe un mensaje"), "¿A qué hora llega?");
    await user.click(screen.getByRole("button", { name: "Enviar mensaje" }));
    await waitFor(() =>
      expect(hooks.send).toHaveBeenCalledWith({ body: "¿A qué hora llega?", providerId: "prov-b" }),
    );
  });

  it("no envía mensajes vacíos", async () => {
    renderWithProviders(<RequestChat requestId="r1" />);
    expect(screen.getByRole("button", { name: "Enviar mensaje" })).toBeDisabled();
  });
});
