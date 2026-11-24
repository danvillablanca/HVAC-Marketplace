import { expect, test } from "@playwright/test";
import { loginAsDemo, waitForApi } from "./helpers";

test.describe("Asistente /chat", () => {
  test("sin sesion pide iniciar sesion", async ({ page }) => {
    await page.goto("/chat");

    await expect(page.getByRole("heading", { level: 1, name: "Asistente HVAC" })).toBeVisible();
    await expect(page.getByText(/Inicia sesión para usar el asistente/)).toBeVisible();
    await expect(page.getByLabel("Escribe tu consulta")).toBeDisabled();
  });

  test("con sesion envia un mensaje y recibe la respuesta del asistente", async ({ page }) => {
    await loginAsDemo(page, "cliente");
    await page.goto("/chat");

    const userMessage = "Necesito instalar un aire acondicionado split";
    const response = waitForApi(page, (url) => url.pathname === "/api/ai/chat", "POST");

    await page.getByLabel("Escribe tu consulta").fill(userMessage);
    await page.getByRole("button", { name: "Enviar mensaje" }).click();
    await response;

    const log = page.getByRole("log", { name: "Conversacion con el asistente" });
    await expect(log.getByText(userMessage, { exact: true })).toBeVisible();
    // Sin GEMINI_API_KEY (CI) responde por reglas: la de instalación habla de BTU.
    await expect(log.getByText(/BTU/)).toBeVisible();
  });
});
