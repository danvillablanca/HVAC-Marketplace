import { describe, expect, it } from "vitest";
import { serviceRequestUpdateSchema } from "./service-request";
import { cancelReasonText } from "../utils/constants";

describe("serviceRequestUpdateSchema (SOL-05, motivo obligatorio)", () => {
  it("PR-024: rechaza cancelar sin motivo", () => {
    const r = serviceRequestUpdateSchema.safeParse({ status: "cancelada" });
    expect(r.success).toBe(false);
  });

  it("PR-024: acepta un motivo de la lista", () => {
    const r = serviceRequestUpdateSchema.safeParse({
      status: "cancelada",
      reason: "presupuesto_alto",
    });
    expect(r.success).toBe(true);
  });

  it("PR-024: 'otro' exige describir el motivo", () => {
    expect(
      serviceRequestUpdateSchema.safeParse({ status: "cancelada", reason: "otro" }).success,
    ).toBe(false);
    expect(
      serviceRequestUpdateSchema.safeParse({
        status: "cancelada",
        reason: "otro",
        reasonDetail: "  ",
      }).success,
    ).toBe(false);
    expect(
      serviceRequestUpdateSchema.safeParse({
        status: "cancelada",
        reason: "otro",
        reasonDetail: "Me mudé",
      }).success,
    ).toBe(true);
  });

  it("rechaza motivos fuera de la lista", () => {
    const r = serviceRequestUpdateSchema.safeParse({ status: "cancelada", reason: "aburrido" });
    expect(r.success).toBe(false);
  });

  it("las demás transiciones no piden motivo", () => {
    expect(serviceRequestUpdateSchema.safeParse({ status: "en_ejecucion" }).success).toBe(true);
  });

  it("cancelReasonText arma etiqueta y detalle", () => {
    expect(cancelReasonText("resuelto_solo")).toBe("Se resolvió el problema solo");
    expect(cancelReasonText("otro", " Me mudé ")).toBe("Otro: Me mudé");
  });
});
