import { expect, test } from "@playwright/test";
import { waitForApi } from "./helpers";

test.describe("Ficha de proveedor /proveedor/:id", () => {
  test("muestra nombre, verificacion, servicios, precio y resenas", async ({ page }) => {
    const detailResponse = waitForApi(
      page,
      (url) => url.pathname === "/api/providers/p-clima-andes",
    );
    await page.goto("/proveedor/p-clima-andes");
    await detailResponse;

    await expect(page.getByRole("heading", { level: 1, name: "Clima Andes SpA" })).toBeVisible();

    await expect(page.getByText("Verificado").first()).toBeVisible();

    await expect(page.getByRole("heading", { name: "Servicios y precios" })).toBeVisible();
    await expect(page.getByText("Ventilación industrial y comercial")).toBeVisible();
    await expect(page.getByText("$95.000")).toBeVisible();

    await expect(page.getByRole("heading", { name: /Resenas \(132\)/ })).toBeVisible();
    await expect(page.getByText("Rodrigo M.")).toBeVisible();
    await expect(page.getByText("Carolina P.")).toBeVisible();
  });

  test("un proveedor inexistente muestra el estado vacio", async ({ page }) => {
    const notFoundResponse = waitForApi(
      page,
      (url) => url.pathname === "/api/providers/p-no-existe",
    );
    await page.goto("/proveedor/p-no-existe");
    await notFoundResponse;

    await expect(page.getByRole("heading", { name: "Proveedor no encontrado" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Volver a la busqueda/ })).toBeVisible();
  });
});
