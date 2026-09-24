import { expect, test } from "@playwright/test";
import { loginWithCredentials } from "./helpers";

test.describe("Autenticacion", () => {
  test("login demo de cliente redirige a su panel", async ({ page }) => {
    await loginWithCredentials(page, "cliente@demo.cl", "demo1234");

    await expect(page).toHaveURL(/\/panel\/solicitudes$/);
    await expect(page.getByRole("heading", { name: "Hola, Cliente" })).toBeVisible();
    await expect(page.getByText("Mis solicitudes")).toBeVisible();
  });

  test("login demo de proveedor redirige a su panel", async ({ page }) => {
    await loginWithCredentials(page, "proveedor@demo.cl", "demo1234");

    await expect(page).toHaveURL(/\/panel\/proveedor$/);
    await expect(page.getByRole("heading", { name: "Hola, Proveedor" })).toBeVisible();
  });

  test("credenciales invalidas muestran un error", async ({ page }) => {
    await loginWithCredentials(page, "nadie@demo.cl", "mala-clave");

    await expect(page.getByRole("alert")).toContainText("incorrectos");
    await expect(page).toHaveURL(/\/ingresar$/);
  });

  test("el registro permite elegir el rol de la cuenta", async ({ page }) => {
    await page.goto("/registro");

    const roleSelect = page.getByLabel("Tipo de cuenta");
    await expect(roleSelect).toBeVisible();
    await expect(roleSelect.locator("option")).toHaveCount(2);
    await expect(roleSelect).toContainText("Proveedor (ofrezco servicios HVAC)");

    await roleSelect.selectOption("proveedor");

    await expect(page.getByLabel("RUT de la empresa")).toBeVisible();
    await expect(page.getByLabel("Telefono")).toBeVisible();
  });
});
