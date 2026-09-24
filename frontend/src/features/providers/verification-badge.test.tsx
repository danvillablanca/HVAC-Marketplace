import { describe, expect, it } from "vitest";
import type { ProviderVerificationStatus } from "@hvac/shared";
import { renderWithProviders, screen } from "@/test/render";
import { VerificationBadge } from "./verification-badge";

const CASES: Array<[ProviderVerificationStatus, string]> = [
  ["verificado", "Verificado"],
  ["en_revision", "En revision"],
  ["pendiente", "Pendiente"],
  ["rechazado", "Rechazado"],
];

describe("VerificationBadge", () => {
  it.each(CASES)("muestra el texto correcto para %s", (status, label) => {
    renderWithProviders(<VerificationBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
