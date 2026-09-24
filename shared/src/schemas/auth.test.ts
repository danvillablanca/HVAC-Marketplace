import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema, rutSchema, phoneSchema } from "./auth";

const validUuid = "00000000-0000-4000-8000-000000000000";

describe("schemas/auth", () => {
  describe("rutSchema", () => {
    it("normaliza y acepta un RUT valido", () => {
      const result = rutSchema.safeParse("12.345.678-5");
      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toBe("123456785");
    });

    it("rechaza un RUT con dv incorrecto", () => {
      expect(rutSchema.safeParse("12345678-9").success).toBe(false);
    });

    it("rechaza un RUT con letras invalidas", () => {
      expect(rutSchema.safeParse("abc-5").success).toBe(false);
    });

    it("rechaza un RUT vacio o demasiado corto", () => {
      expect(rutSchema.safeParse("").success).toBe(false);
      expect(rutSchema.safeParse("1").success).toBe(false);
    });
  });

  describe("phoneSchema", () => {
    it("normaliza un movil de 9 digitos con prefijo +56", () => {
      const result = phoneSchema.safeParse("912345678");
      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toBe("+56912345678");
    });

    it("acepta formatos con separadores", () => {
      const result = phoneSchema.safeParse("+56 9 1234 5678");
      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toBe("+56912345678");
    });

    it("rechaza telefonos demasiado cortos", () => {
      expect(phoneSchema.safeParse("123").success).toBe(false);
    });

    it("rechaza numeros que no calzan con +56 9 XXXX XXXX", () => {
      expect(phoneSchema.safeParse("12345678").success).toBe(false);
      expect(phoneSchema.safeParse("91234567").success).toBe(false);
    });
  });

  describe("registerSchema", () => {
    const base = {
      email: "Usuario@Example.com",
      password: "supersecreto",
      fullName: "Juan Perez",
      role: "cliente" as const,
    };

    it("acepta un registro valido con RUT y telefono", () => {
      const result = registerSchema.safeParse({
        ...base,
        rut: "12.345.678-5",
        phone: "+56 9 1234 5678",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("usuario@example.com");
        expect(result.data.rut).toBe("123456785");
        expect(result.data.phone).toBe("+56912345678");
      }
    });

    it("acepta un registro sin RUT ni telefono (opcionales)", () => {
      const result = registerSchema.safeParse(base);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rut).toBeUndefined();
        expect(result.data.phone).toBeUndefined();
      }
    });

    it("rechaza email invalido", () => {
      expect(registerSchema.safeParse({ ...base, email: "no-es-email" }).success).toBe(false);
    });

    it("rechaza contrasena demasiado corta", () => {
      expect(registerSchema.safeParse({ ...base, password: "123" }).success).toBe(false);
    });

    it("rechaza nombre demasiado corto", () => {
      expect(registerSchema.safeParse({ ...base, fullName: "ab" }).success).toBe(false);
    });

    it("rechaza roles fuera del enum", () => {
      expect(registerSchema.safeParse({ ...base, role: "superadmin" }).success).toBe(false);
    });

    it("acepta todos los roles permitidos", () => {
      for (const role of ["cliente", "proveedor", "admin"] as const) {
        expect(registerSchema.safeParse({ ...base, role }).success).toBe(true);
      }
    });
  });

  describe("loginSchema", () => {
    it("acepta credenciales validas y normaliza el email", () => {
      const result = loginSchema.safeParse({ email: "USER@Mail.com", password: "x" });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.email).toBe("user@mail.com");
    });

    it("rechaza email invalido", () => {
      expect(loginSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
    });

    it("rechaza contrasena vacia", () => {
      expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
    });
  });

  it("expone un uuid de ejemplo valido para otros schemas", () => {
    expect(validUuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });
});
