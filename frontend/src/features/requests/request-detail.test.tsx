import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ServiceRequestDetail } from "@hvac/shared";
import { renderWithProviders, screen, userEvent } from "@/test/render";
import { RequestDetail } from "./request-detail";

const state = vi.hoisted(() => ({
  detail: undefined as unknown,
  mutate: vi.fn(),
}));

vi.mock("@/features/auth/auth-context", async (orig) => ({
  ...(await orig<object>()),
  useAuth: () => ({ role: "cliente", user: { id: "c1" } }),
}));
vi.mock("@/features/chat", () => ({ RequestChat: () => null }));
vi.mock("./hooks", () => ({
  useServiceRequestDetail: () => ({ data: state.detail, isLoading: false, error: null }),
  useDecideQuote: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useConfirmCompletion: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useTransitionRequest: () => ({ mutateAsync: state.mutate, isPending: false }),
}));

const detail = (extra: Partial<ServiceRequestDetail> = {}): Partial<ServiceRequestDetail> => ({
  id: "r1",
  clientId: "c1",
  serviceName: "Mantención",
  equipment: "split",
  description: "Mantención preventiva de un equipo split",
  urgency: "media",
  status: "abierta",
  commune: "Ñuñoa",
  quotes: [],
  events: [],
  createdAt: "2026-11-01T10:00:00Z",
  ...extra,
});

beforeEach(() => {
  state.detail = detail();
  state.mutate = vi.fn().mockResolvedValue({});
});

describe("RequestDetail: cancelar con motivo obligatorio (SOL-05)", () => {
  it("PR-024: no deja confirmar sin motivo y 'Otro' exige detalle", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RequestDetail requestId="r1" />);

    await user.click(screen.getByRole("button", { name: "Cancelar solicitud" }));
    const confirm = screen.getByRole("button", { name: "Confirmar cancelación" });
    expect(confirm).toBeDisabled();

    await user.selectOptions(screen.getByLabelText(/Motivo de la cancelación/), "otro");
    expect(confirm).toBeDisabled();
    await user.type(screen.getByLabelText(/Cuéntanos el motivo/), "Me cambié de casa");
    expect(confirm).toBeEnabled();

    await user.click(confirm);
    expect(state.mutate).toHaveBeenCalledWith({
      id: "r1",
      status: "cancelada",
      reason: "otro",
      reasonDetail: "Me cambié de casa",
    });
  });

  it("PR-024: un motivo de la lista basta para confirmar", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RequestDetail requestId="r1" />);

    await user.click(screen.getByRole("button", { name: "Cancelar solicitud" }));
    await user.selectOptions(screen.getByLabelText(/Motivo de la cancelación/), "presupuesto_alto");
    await user.click(screen.getByRole("button", { name: "Confirmar cancelación" }));
    expect(state.mutate).toHaveBeenCalledWith({
      id: "r1",
      status: "cancelada",
      reason: "presupuesto_alto",
      reasonDetail: undefined,
    });
  });

  it("muestra el motivo de una solicitud cancelada", () => {
    state.detail = detail({
      status: "cancelada",
      cancelReason: "proveedor_otra_via",
      cancelReasonDetail: null,
      cancelledAt: "2026-11-05T10:00:00Z",
    });
    renderWithProviders(<RequestDetail requestId="r1" />);
    expect(screen.getByTestId("cancel-reason-text")).toHaveTextContent(
      "Motivo: Proveedor encontrado por otra vía",
    );
  });
});
