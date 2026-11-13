import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DateRange, ProviderMetricsResponse } from "@hvac/shared";
import { buildSnapshot, computeDeltas, previousPeriod } from "@hvac/shared";
import { renderWithProviders, screen, userEvent } from "@/test/render";
import { ProviderMetrics, presetRange } from "./provider-metrics";

const state = vi.hoisted(() => ({ calls: [] as DateRange[] }));

const current = buildSnapshot({
  received: 10,
  quoted: 5,
  accepted: 2,
  receivedQuoted: 5,
  quotedAccepted: 2,
  avgFirstResponseSeconds: 5400,
  acceptedAmount: 250000,
  cancelReasons: { presupuesto_alto: 3, otro: 1 },
});
const previous = buildSnapshot({
  received: 8,
  quoted: 5,
  accepted: 0,
  receivedQuoted: 4,
  quotedAccepted: 0,
  avgFirstResponseSeconds: 7200,
  acceptedAmount: 0,
});

vi.mock("./provider-hooks", () => ({
  useProviderMetrics: (range: DateRange) => {
    state.calls.push(range);
    const data: ProviderMetricsResponse = {
      range,
      previousRange: previousPeriod(range),
      current,
      previous,
      deltas: computeDeltas(current, previous),
    };
    return { data, isLoading: false, error: null };
  },
}));

beforeEach(() => {
  state.calls = [];
});

describe("ProviderMetrics", () => {
  it("muestra los 7 KPI con su variación frente al período anterior", () => {
    renderWithProviders(<ProviderMetrics />);
    expect(screen.getByTestId("metric-received")).toHaveTextContent("10");
    expect(screen.getByTestId("metric-received")).toHaveTextContent("+25%");
    expect(screen.getByTestId("metric-quoteRate")).toHaveTextContent("50%");
    expect(screen.getByTestId("metric-quoteRate")).toHaveTextContent("0 pp");
    expect(screen.getByTestId("metric-accepted")).toHaveTextContent("Sin datos previos");
    expect(screen.getByTestId("metric-acceptedAmount")).toHaveTextContent("$250.000");
    expect(screen.getByTestId("metric-avgFirstResponseSeconds")).toHaveTextContent("1,5 h");
    expect(screen.getByTestId("metric-avgFirstResponseSeconds")).toHaveTextContent("-25%");
    expect(screen.getByTestId("cancel-reason-presupuesto_alto")).toHaveTextContent("3 (75%)");
  });

  it("por defecto consulta el mes en curso y permite cambiar el período", async () => {
    renderWithProviders(<ProviderMetrics />);
    expect(state.calls.at(-1)).toEqual(presetRange("este_mes"));

    await userEvent.selectOptions(screen.getByLabelText("Período"), "mes_anterior");
    expect(state.calls.at(-1)).toEqual(presetRange("mes_anterior"));

    await userEvent.selectOptions(screen.getByLabelText("Período"), "personalizado");
    expect(screen.getByLabelText("Desde")).toBeInTheDocument();
    expect(screen.getByLabelText("Hasta")).toBeInTheDocument();
  });

  it("presets de rango", () => {
    const today = new Date(2026, 10, 13);
    expect(presetRange("este_mes", today)).toEqual({ from: "2026-11-01", to: "2026-11-13" });
    expect(presetRange("mes_anterior", today)).toEqual({ from: "2026-10-01", to: "2026-10-31" });
    expect(presetRange("ultimos_30", today)).toEqual({ from: "2026-10-15", to: "2026-11-13" });
  });
});
