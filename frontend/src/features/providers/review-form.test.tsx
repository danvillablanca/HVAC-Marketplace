import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen, userEvent, waitFor } from "@/test/render";
import { ReviewForm } from "./review-form";

function okResponse<T>(data: T) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ ok: true, data }),
  } as unknown as Response;
}

const CREATED = {
  id: "r-new",
  providerId: "p-clima-andes",
  rating: 4,
  comment: null,
  authorName: "Yo",
  createdAt: "2026-09-01T00:00:00.000Z",
  verified: false,
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ReviewForm", () => {
  it("no publica sin calificacion", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderWithProviders(<ReviewForm providerId="p-clima-andes" />);

    const submit = screen.getByRole("button", { name: /publicar resena/i });
    expect(submit).toBeDisabled();

    await user.click(submit);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("publica la resena con la calificacion elegida", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse(CREATED));
    vi.stubGlobal("fetch", fetchMock);
    const onSuccess = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<ReviewForm providerId="p-clima-andes" onSuccess={onSuccess} />);

    await user.click(screen.getByRole("radio", { name: "4 estrellas" }));
    await user.click(screen.getByRole("button", { name: /publicar resena/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toContain("/api/reviews");
    expect((init as RequestInit).method).toBe("POST");
    expect(JSON.parse(String((init as RequestInit).body))).toMatchObject({
      providerId: "p-clima-andes",
      rating: 4,
    });

    expect(await screen.findByText("Gracias por tu resena")).toBeInTheDocument();
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("muestra el mensaje de error cuando la API falla", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const user = userEvent.setup();

    renderWithProviders(<ReviewForm providerId="p-clima-andes" />);

    await user.click(screen.getByRole("radio", { name: "5 estrellas" }));
    await user.click(screen.getByRole("button", { name: /publicar resena/i }));

    expect(
      await screen.findByText("No pudimos publicar tu resena. Intenta nuevamente."),
    ).toBeInTheDocument();
  });
});
