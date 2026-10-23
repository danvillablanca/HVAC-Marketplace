import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { VerificationDecisionInput } from "@hvac/shared";
import { getDemoProvider } from "../data/demo";
import { HttpError } from "../lib/http";
import { decideVerification, listPendingVerifications } from "./verification";

describe("listPendingVerifications (fallback demo)", () => {
  it("incluye proveedores pendientes y en revisión", async () => {
    const pending = await listPendingVerifications();
    const ids = pending.map((provider) => provider.id);

    expect(ids).toContain("p-calor-central");
    expect(ids).toContain("p-termica-norte");
    expect(ids).not.toContain("p-clima-andes");
    expect(
      pending.every(
        (provider) =>
          provider.verificationStatus === "pendiente" ||
          provider.verificationStatus === "en_revision",
      ),
    ).toBe(true);
  });
});

describe("decideVerification (fallback demo)", () => {
  it("actualiza el estado de verificación del proveedor", async () => {
    const input: VerificationDecisionInput = {
      providerId: "p-termica-norte",
      decision: "verificado",
    };

    const result = await decideVerification(input);

    expect(result).toEqual({ providerId: "p-termica-norte", status: "verificado" });
    expect(getDemoProvider("p-termica-norte")?.verificationStatus).toBe("verificado");
  });

  it("lanza HttpError 404 si el proveedor no existe", async () => {
    const input: VerificationDecisionInput = {
      providerId: randomUUID(),
      decision: "rechazado",
    };

    const error = await decideVerification(input).catch((err) => err);
    expect(error).toBeInstanceOf(HttpError);
    expect(error.status).toBe(404);
    expect(error.code).toBe("not_found");
  });
});
