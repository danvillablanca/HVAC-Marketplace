import { expect, test } from "@playwright/test";
import { loginAsDemo } from "./helpers";

test.describe("Paneles", () => {
  test("admin accede a la bandeja de verificacion", async ({ page }) => {
    await loginAsDemo(page, "admin");
    await page.goto("/panel/admin/verificaciones");

    await expect(
      page.getByRole("heading", { level: 1, name: "Bandeja de verificacion" }),
    ).toBeVisible();
    await expect(page.getByText("Térmica Norte Ingeniería")).toBeVisible();
    await expect(page.getByText("Calor Central SpA")).toBeVisible();
    await expect(page.getByRole("button", { name: "Aprobar" }).first()).toBeVisible();
  });

  test("proveedor no admin es redirigido fuera de la bandeja admin", async ({ page }) => {
    await loginAsDemo(page, "proveedor");
    await page.goto("/panel/admin/verificaciones");

    // Rebota por /ingresar y, como ya tiene sesion, termina en su propio panel.
    await expect(page).toHaveURL(/\/panel\/proveedor$/);
    await expect(page.getByText("Bandeja de verificacion")).toHaveCount(0);
  });

  test("proveedor ve su dashboard", async ({ page }) => {
    await loginAsDemo(page, "proveedor");
    await page.goto("/panel/proveedor");

    await expect(page.getByRole("heading", { name: "Hola, Proveedor" })).toBeVisible();
    await expect(page.getByText("Solicitudes disponibles", { exact: true })).toBeVisible();
    await expect(page.getByText("Estado de verificacion", { exact: true })).toBeVisible();
  });

  test("proveedor verificado ve su estado en la pagina de verificacion", async ({ page }) => {
    await loginAsDemo(page, "proveedor");
    await page.goto("/panel/proveedor/verificacion");

    await expect(page.getByText("Empresa verificada")).toBeVisible();
  });

  test("PR-007/PR-008 el proveedor edita su perfil y servicios desde 'Editar perfil'", async ({
    page,
  }) => {
    await loginAsDemo(page, "proveedor");
    await page.goto("/panel/proveedor");
    await page.getByRole("link", { name: /Editar perfil/ }).click();
    await expect(page).toHaveURL(/\/panel\/proveedor\/perfil$/);

    await page.getByLabel("Inspeccion tecnica HVAC", { exact: true }).check();
    await page.getByRole("button", { name: /Guardar perfil/ }).click();
    await expect(page.getByText("Perfil guardado.")).toBeVisible();

    await page.reload();
    await expect(page.getByLabel("Inspeccion tecnica HVAC", { exact: true })).toBeChecked();
  });

  test("con sesion no aparece 'Para proveedores' en el navbar", async ({ page }) => {
    await loginAsDemo(page, "cliente");
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Para proveedores", exact: true })).toHaveCount(0);
  });
});
