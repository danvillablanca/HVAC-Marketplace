import { expect, test } from "@playwright/test";
import { waitForApi } from "./helpers";

test.describe("Asistente /chat", () => {
  test("envia un mensaje y recibe la respuesta stub (E2/E3)", async ({ page }) => {
    await page.goto("/chat");

    await expect(page.getByRole("heading", { level: 1, name: "Asistente HVAC" })).toBeVisible();

    const userMessage = "Necesito instalar un aire acondicionado split";
    const response = waitForApi(page, (url) => url.pathname === "/api/ai/chat", "POST");

    await page.getByLabel("Escribe tu consulta").fill(userMessage);
    await page.getByRole("button", { name: "Enviar mensaje" }).click();
    await response;

    const log = page.getByRole("log", { name: "Conversacion con el asistente" });
    await expect(log.getByText(userMessage, { exact: true })).toBeVisible();
    await expect(log.getByText(/E2\/E3/)).toBeVisible();
  });
});
