import { expect, test } from "@playwright/test";

test.describe("Landing /", () => {
  test("carga con titulo y hero con CTA principal y secundario", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Marketplace HVAC/);

    await expect(
      page.getByRole("heading", { level: 1, name: /Encuentra y contrata proveedores HVAC/ }),
    ).toBeVisible();

    const primaryCta = page.getByRole("link", { name: /Publicar requerimiento gratis/ });
    await expect(primaryCta).toBeVisible();
    await expect(primaryCta).toHaveAttribute("href", "/mapa");

    const secondaryCta = page.getByRole("link", { name: /Ver proveedores cerca/ });
    await expect(secondaryCta).toBeVisible();
    await expect(secondaryCta).toHaveAttribute("href", "/buscar");
  });

  test("el CTA del hero navega al mapa", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: /Publicar requerimiento gratis/ }).click();

    await expect(page).toHaveURL(/\/mapa$/);
    await expect(
      page.getByRole("application", { name: "Mapa interactivo de proveedores HVAC" }),
    ).toBeVisible();
  });

  test("la FAQ es interactuable (abre y muestra la respuesta)", async ({ page }) => {
    await page.goto("/");

    const faq = page.locator("#faq");
    await faq.scrollIntoViewIfNeeded();

    const item = faq.locator("details").first();
    const summary = item.locator("summary");

    await expect(summary).toContainText("¿Cómo verifican a los proveedores?");
    await expect(item).not.toHaveAttribute("open", "");

    // Reintenta el click: la seccion usa una animacion `whileInView` que puede
    // hacer que el primer click se pierda en el proyecto mobile.
    await expect(async () => {
      await summary.click();
      await expect(item).toHaveAttribute("open", "");
    }).toPass({ timeout: 10_000 });

    await expect(item.getByText(/Solicitamos RUT de la empresa/)).toBeVisible();
  });

  test("el CTA final muestra su boton secundario visible y con texto (regresion)", async ({
    page,
  }) => {
    await page.goto("/");

    const cta = page.getByRole("region", {
      name: "Tu próximo proveedor HVAC está a un clic.",
    });
    await cta.scrollIntoViewIfNeeded();
    await expect(cta).toBeVisible();

    const primary = cta.getByRole("link", { name: /Publicar requerimiento/ });
    await expect(primary).toBeVisible();

    const secondary = cta.getByRole("link", { name: /Ser proveedor/ });
    await expect(secondary).toBeVisible();
    await expect(secondary).toHaveText(/Ser proveedor/);
    await expect(secondary).toHaveAttribute("href", "/registro");
  });
});
