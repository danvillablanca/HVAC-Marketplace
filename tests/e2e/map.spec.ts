import { expect, test } from "@playwright/test";
import { ensureProviderListVisible, setRangeValue, waitForApi } from "./helpers";

test.describe("Mapa /mapa", () => {
  test("muestra el listado de proveedores y el contenedor del mapa", async ({ page, isMobile }) => {
    await page.goto("/mapa");

    await expect(
      page.getByRole("application", { name: "Mapa interactivo de proveedores HVAC" }),
    ).toBeVisible();

    await ensureProviderListVisible(page, isMobile);
    await expect(page.getByRole("heading", { name: "Clima Andes SpA" })).toBeVisible();
  });

  test("ajustar segmento y radio actualiza los resultados", async ({ page }) => {
    await page.goto("/mapa");

    const visibleResults = page
      .getByText(/\d+ resultados?/)
      .filter({ visible: true })
      .first();
    await expect(visibleResults).toBeVisible();

    const segmentResponse = waitForApi(
      page,
      (url) =>
        url.pathname === "/api/providers/search" &&
        url.searchParams.get("segment") === "industrial",
    );
    await page.getByLabel("Segmento").filter({ visible: true }).first().selectOption("industrial");
    await segmentResponse;

    await expect(page.getByText("2 resultados").filter({ visible: true }).first()).toBeVisible();

    const radiusResponse = waitForApi(
      page,
      (url) => url.pathname === "/api/providers/search" && url.searchParams.get("radiusKm") === "5",
    );
    await setRangeValue(
      page.getByLabel("Radio de busqueda en kilometros").filter({ visible: true }).first(),
      5,
    );
    await radiusResponse;

    await expect(page.getByText("1 resultado").filter({ visible: true }).first()).toBeVisible();
  });

  test("el toggle Mapa/Lista funciona en movil", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Solo aplica al proyecto mobile");

    await page.goto("/mapa");

    await expect(
      page.getByRole("application", { name: "Mapa interactivo de proveedores HVAC" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Lista" }).first().click();
    await expect(page.getByRole("heading", { name: "Clima Andes SpA" })).toBeVisible();

    await page.getByRole("button", { name: "Mapa" }).last().click();
    await expect(page.getByRole("heading", { name: "Clima Andes SpA" })).toBeHidden();
  });
});
