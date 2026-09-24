import { expect, test } from "@playwright/test";
import { loginAsDemo } from "./helpers";

test.describe("Paneles", () => {
  test("admin accede a la bandeja de verificacion", async ({ page }) => {
    await loginAsDemo(page, "admin");
    await page.goto("/panel/admin/verificaciones");

    await expect(
      page.getByRole("heading", { level: 1, name: "Bandeja de verificacion" }),
    ).toBeVisible();
    await expect(page.getByText("Termica Norte Ingenieria")).toBeVisible();
    await expect(page.getByText("Calor Central SpA")).toBeVisible();
    await expect(page.getByRole("button", { name: "Aprobar" }).first()).toBeVisible();
  });

  test("proveedor no admin es redirigido fuera de la bandeja admin", async ({ page }) => {
    await loginAsDemo(page, "proveedor");
    await page.goto("/panel/admin/verificaciones");

    await expect(page).toHaveURL(/\/ingresar$/);
  });

  test("proveedor ve su dashboard", async ({ page }) => {
    await loginAsDemo(page, "proveedor");
    await page.goto("/panel/proveedor");

    await expect(page.getByRole("heading", { name: "Hola, Proveedor" })).toBeVisible();
    await expect(page.getByText("Solicitudes recientes", { exact: true })).toBeVisible();
    await expect(page.getByText("Estado de verificacion", { exact: true })).toBeVisible();
  });

  test("proveedor accede al wizard de verificacion", async ({ page }) => {
    await loginAsDemo(page, "proveedor");
    await page.goto("/panel/proveedor/verificacion");

    await expect(
      page.getByRole("heading", { level: 1, name: "Verificacion de proveedor" }),
    ).toBeVisible();
    await expect(page.getByText("Paso 1 de 3")).toBeVisible();
    await expect(page.getByLabel("Razon social")).toBeVisible();
  });
});
