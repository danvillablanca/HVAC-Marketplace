import { expect, test } from "@playwright/test";
import { loginAsDemo } from "./helpers";

// Caso reportado: una empresa nueva no aparecia en /buscar. Debe aparecer tras
// verificarse, al buscar desde una comuna dentro de su cobertura.
test.describe.configure({ mode: "serial" });

test("PR-015/PR-016 una empresa nueva aparece en la busqueda tras su verificacion", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Se valida una vez en escritorio");
  const name = `Empresa Visible ${Date.now()}`;

  await page.goto("/registro");
  await page.getByLabel("Nombre completo").fill(name);
  await page.getByLabel("Correo electronico").fill(`visible.${Date.now()}@test.cl`);
  await page.getByLabel("Tipo de cuenta").selectOption("proveedor");
  await page.getByLabel("RUT de la empresa").fill("76.123.456-0");
  await page.getByLabel("Telefono").fill("+56 9 4444 5555");
  await page.getByLabel("Contrasena").fill("clave1234");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/panel\/proveedor$/);

  await page.getByRole("link", { name: "Completar perfil" }).first().click();
  await page.getByLabel("Nombre comercial o razón social").fill(name);
  await page.getByLabel("RUT de la empresa").fill("76.123.456-0");
  await page.getByLabel("Teléfono").fill("+56 9 4444 5555");
  await page.getByLabel("Comuna base").selectOption("Lo Barnechea");
  await page.getByLabel("Venta e instalacion de equipos Split", { exact: true }).check();
  await page.getByRole("button", { name: /Guardar perfil/ }).click();
  await expect(page.getByText("Perfil guardado.")).toBeVisible();

  await page.goto("/panel/proveedor");
  await expect(page.getByText("¿Por qué no apareces en la búsqueda?")).toBeVisible();
  await page.getByRole("link", { name: "Enviar a verificación" }).click();
  await page.getByRole("button", { name: /Continuar/ }).click();
  for (const box of await page.locator('input[id^="doc-"]').all()) await box.check();
  await page.getByRole("button", { name: /Continuar/ }).click();
  await page.getByRole("button", { name: /Enviar a revision/ }).click();
  await expect(page.getByText("Solicitud en revision")).toBeVisible();

  await page.goto("/buscar");
  await page.getByLabel("Comuna").selectOption("Lo Barnechea");
  await expect(page.getByText("Resultados cerca de Lo Barnechea.")).toBeVisible();
  await expect(page.getByText(name)).toHaveCount(0);

  await loginAsDemo(page, "admin");
  await page.goto("/panel/admin/verificaciones");
  await page.locator("tr", { hasText: name }).getByRole("button", { name: "Aprobar" }).click();
  await expect(page.locator("tr", { hasText: name })).toHaveCount(0);

  await page.goto("/buscar");
  await page.getByLabel("Comuna").selectOption("Lo Barnechea");
  await expect(page.getByText(name)).toBeVisible();
});
