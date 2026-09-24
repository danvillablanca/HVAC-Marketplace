import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("lib/utils", () => {
  describe("cn", () => {
    it("combina clases simples", () => {
      expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("resuelve conflictos de Tailwind quedándose con la última", () => {
      expect(cn("px-2", "px-4")).toBe("px-4");
      expect(cn("text-sm", "text-lg")).toBe("text-lg");
    });

    it("ignora valores falsy (false, null, undefined, 0, '')", () => {
      expect(cn("base", false && "oculto", null, undefined, 0, "", "final")).toBe("base final");
    });

    it("acepta arrays y objetos condicionales al estilo clsx", () => {
      expect(cn(["a", "b"], { c: true, d: false })).toBe("a b c");
    });

    it("devuelve cadena vacía sin argumentos", () => {
      expect(cn()).toBe("");
    });
  });
});
