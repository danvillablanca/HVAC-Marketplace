import { expect, test } from "@playwright/test";
import { waitForApi } from "./helpers";

test.describe("Buscar /buscar", () => {
  test("lista proveedores cercanos", async ({ page }) => {
    await page.goto("/buscar");

    await expect(page.getByRole("heading", { level: 1, name: "Buscar proveedores" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Clima Andes SpA" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Frío Sur Climatización Ltda." })).toBeVisible();
  });

  test("filtra proveedores por texto", async ({ page }) => {
    await page.goto("/buscar");

    await expect(page.getByRole("heading", { name: "Clima Andes SpA" })).toBeVisible();

    const response = waitForApi(
      page,
      (url) =>
        url.pathname === "/api/providers/search" && url.searchParams.get("query") === "solar",
    );
    await page.getByLabel("Buscar servicio o proveedor").fill("solar");
    await response;

    await expect(page.getByRole("heading", { name: "Solar Verde Energía" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Clima Andes SpA" })).toBeHidden();
  });

  test("el enlace Ver en mapa navega al mapa", async ({ page }) => {
    await page.goto("/buscar");

    const link = page.getByRole("link", { name: "Ver en mapa" });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", /^\/mapa/);

    await link.click();
    await expect(page).toHaveURL(/\/mapa/);
    await expect(
      page.getByRole("application", { name: "Mapa interactivo de proveedores HVAC" }),
    ).toBeVisible();
  });
});
