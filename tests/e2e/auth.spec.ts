import { expect, test } from "@playwright/test";
import { loginWithCredentials } from "./helpers";

test.describe("Autenticacion", () => {
  test("login demo de cliente redirige a su panel", async ({ page }) => {
    await loginWithCredentials(page, "cliente@demo.cl", "demo1234");

    await expect(page).toHaveURL(/\/panel\/solicitudes$/);
    await expect(page.getByRole("heading", { name: "Hola, Cliente" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Nueva solicitud" })).toBeVisible();
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

  test("PR-001 el registro exige aceptar terminos y crea la cuenta", async ({ page }) => {
    await page.goto("/registro");
    await page.getByLabel("Nombre completo").fill("Cliente E2E");
    await page.getByLabel("Correo electronico").fill(`e2e.${Date.now()}@test.cl`);
    await page.getByLabel("Contrasena").fill("clave1234");
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page.getByText("Debes aceptar los terminos")).toBeVisible();

    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page).toHaveURL(/\/panel\/solicitudes$/);
  });

  test("PR-003 el login enlaza a la recuperacion de contrasena", async ({ page }) => {
    await page.goto("/ingresar");
    await page.getByRole("link", { name: "¿Olvidaste tu contraseña?" }).click();
    await expect(page).toHaveURL(/\/recuperar$/);
    await expect(page.getByRole("heading", { name: "Recupera tu contraseña" })).toBeVisible();
  });
});
