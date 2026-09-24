import { describe, it, expect } from "vitest";
import { formatCLP, normalizePhone, formatPhone, formatDistance, formatDate } from "./format";

describe("utils/format", () => {
  describe("formatCLP", () => {
    it("formatea montos con separador de miles y simbolo $", () => {
      expect(formatCLP(1234567)).toBe("$1.234.567");
      expect(formatCLP(1000)).toBe("$1.000");
      expect(formatCLP(0)).toBe("$0");
    });

    it("no incluye decimales (redondea)", () => {
      expect(formatCLP(1500.4)).toBe("$1.500");
      expect(formatCLP(1500.6)).toBe("$1.501");
    });

    it("maneja montos negativos", () => {
      expect(formatCLP(-5000)).toBe("$-5.000");
    });

    it("devuelve em dash para valores ausentes o NaN", () => {
      expect(formatCLP(null)).toBe("—");
      expect(formatCLP(undefined)).toBe("—");
      expect(formatCLP(Number.NaN)).toBe("—");
    });
  });

  describe("normalizePhone", () => {
    it("prefija +56 a un movil de 9 digitos", () => {
      expect(normalizePhone("912345678")).toBe("+56912345678");
    });

    it("respeta el prefijo 56 ya presente", () => {
      expect(normalizePhone("56912345678")).toBe("+56912345678");
      expect(normalizePhone("+56 9 1234 5678")).toBe("+56912345678");
    });

    it("limpia separadores antes de normalizar", () => {
      expect(normalizePhone("(9) 1234-5678")).toBe("+56912345678");
      expect(normalizePhone("+56 (9) 1234 5678")).toBe("+56912345678");
    });

    it("antepone + a entradas que no coinciden con el patron", () => {
      expect(normalizePhone("12345")).toBe("+12345");
      expect(normalizePhone("")).toBe("+");
    });
  });

  describe("formatPhone", () => {
    it("formatea numeros chilenos validos", () => {
      expect(formatPhone("912345678")).toBe("+56 9 1234 5678");
      expect(formatPhone("56912345678")).toBe("+56 9 1234 5678");
      expect(formatPhone("+56 9 1234 5678")).toBe("+56 9 1234 5678");
    });

    it("devuelve el valor normalizado si no coincide el patron", () => {
      expect(formatPhone("12345")).toBe("+12345");
    });
  });

  describe("formatDistance", () => {
    it("usa metros por debajo de 1 km", () => {
      expect(formatDistance(0)).toBe("0 m");
      expect(formatDistance(500)).toBe("500 m");
      expect(formatDistance(999)).toBe("999 m");
      expect(formatDistance(999.4)).toBe("999 m");
    });

    it("usa kilometros con un decimal desde 1000 m", () => {
      expect(formatDistance(1000)).toBe("1.0 km");
      expect(formatDistance(1500)).toBe("1.5 km");
      expect(formatDistance(12345)).toBe("12.3 km");
    });

    it("devuelve em dash para valores ausentes", () => {
      expect(formatDistance(null)).toBe("—");
      expect(formatDistance(undefined)).toBe("—");
    });
  });

  describe("formatDate", () => {
    it("formatea una fecha ISO a dd-mm-aaaa", () => {
      expect(formatDate("2026-10-01T10:00:00-03:00")).toBe("01-10-2026");
      expect(formatDate("2026-01-05T10:00:00-03:00")).toBe("05-01-2026");
    });

    it("devuelve em dash para fechas invalidas", () => {
      expect(formatDate("no-es-fecha")).toBe("—");
      expect(formatDate("")).toBe("—");
    });
  });
});
