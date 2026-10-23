import { describe, it, expect } from "vitest";
import { normalizeRut, computeRutDv, isValidRut, formatRut } from "./rut";

describe("utils/rut", () => {
  describe("normalizeRut", () => {
    it("elimina puntos y guion dejando solo cuerpo y dv", () => {
      expect(normalizeRut("12.345.678-5")).toBe("123456785");
      expect(normalizeRut("11.111.111-1")).toBe("111111111");
    });

    it("acepta RUT sin separadores", () => {
      expect(normalizeRut("12345678-5")).toBe("123456785");
      expect(normalizeRut("123456785")).toBe("123456785");
    });

    it("elimina espacios y caracteres no alfanumericos", () => {
      expect(normalizeRut("  12.345.678-5  ")).toBe("123456785");
      expect(normalizeRut("12_345_678-5")).toBe("123456785");
    });

    it("pasa el digito verificador K a mayuscula", () => {
      expect(normalizeRut("1000005-k")).toBe("1000005K");
      expect(normalizeRut("10.000.05-K")).toBe("1000005K");
    });

    it("devuelve la cadena limpia cuando es demasiado corta", () => {
      expect(normalizeRut("")).toBe("");
      expect(normalizeRut("1")).toBe("1");
      expect(normalizeRut("K")).toBe("K");
    });
  });

  describe("computeRutDv", () => {
    it("calcula el dv de cuerpos conocidos", () => {
      expect(computeRutDv("11111111")).toBe("1");
      expect(computeRutDv("12345678")).toBe("5");
      expect(computeRutDv("76086428")).toBe("5");
    });

    it("acepta numeros y strings con separadores", () => {
      expect(computeRutDv(12345678)).toBe("5");
      expect(computeRutDv("12.345.678")).toBe("5");
    });

    it("devuelve K cuando el resto es 10", () => {
      expect(computeRutDv("1000005")).toBe("K");
    });

    it("devuelve 0 cuando el resto es 11", () => {
      expect(computeRutDv("1000013")).toBe("0");
    });
  });

  describe("isValidRut", () => {
    const validRuts = [
      "11111111-1",
      "12345678-5",
      "12.345.678-5",
      "111111111",
      "1000005-K",
      "1000005k",
      "10.000.013-K",
    ];

    it.each(validRuts)("acepta RUT valido %s", (rut) => {
      expect(isValidRut(rut)).toBe(true);
    });

    const invalidRuts = [
      "",
      "1",
      "K",
      "abc",
      "12a45678-5",
      "ac-5",
      "12345678-9",
      "11111111-2",
      "12-3",
      "12345678",
      "12.345.678",
    ];

    it.each(invalidRuts)("rechaza RUT invalido %s", (rut) => {
      expect(isValidRut(rut)).toBe(false);
    });

    it("acepta un RUT construido con computeRutDv", () => {
      const body = "20456789";
      expect(isValidRut(`${body}-${computeRutDv(body)}`)).toBe(true);
    });
  });

  describe("formatRut", () => {
    it("formatea con puntos y guion", () => {
      expect(formatRut("123456785")).toBe("12.345.678-5");
      expect(formatRut("11111111-1")).toBe("11.111.111-1");
      expect(formatRut("12345678-5")).toBe("12.345.678-5");
    });

    it("es idempotente sobre un RUT ya formateado", () => {
      expect(formatRut("12.345.678-5")).toBe("12.345.678-5");
    });

    it("formatea el dv K en mayuscula", () => {
      expect(formatRut("1000005k")).toBe("1.000.005-K");
    });

    it("devuelve la cadena limpia si es demasiado corta", () => {
      expect(formatRut("1")).toBe("1");
      expect(formatRut("")).toBe("");
    });
  });
});
