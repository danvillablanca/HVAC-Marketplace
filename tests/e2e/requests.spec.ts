import { expect, test } from "@playwright/test";
import { loginAsDemo } from "./helpers";

// Ciclo completo de una solicitud en modo demo (REQ-SOL-01..05, REQ-COT-01..03).
// El backend demo guarda el estado en memoria, por eso el test corre en serie.
test.describe.configure({ mode: "serial" });

test("PR-020..PR-027 solicitud, cotizacion, aceptacion, ejecucion y confirmacion", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "El ciclo se valida una vez en escritorio");
  const ref = `ref-${Date.now()}`;

  await loginAsDemo(page, "cliente");
  await page.goto("/panel/solicitudes/nueva");
  await page
    .getByLabel("Tipo de servicio")
    .selectOption({ label: "Venta e instalacion de equipos Split" });
  await page
    .getByLabel("Descripción del problema o servicio")
    .fill(`Instalar split en dormitorio ${ref}`);
  await page.getByLabel("Comuna").selectOption("Ñuñoa");
  await page.getByRole("button", { name: "Publicar solicitud" }).click();
  await expect(page).toHaveURL(/\/panel\/solicitudes$/);

  await loginAsDemo(page, "proveedor");
  await page.goto("/panel/proveedor/bandeja");
  await page.getByText(ref).first().click();
  await expect(page.getByText(/La dirección y los datos del cliente/)).toBeVisible();
  await page.getByLabel("Monto (CLP)").fill("90000");
  await page
    .getByLabel("Alcance del trabajo")
    .fill("Instalación completa con materiales y garantía de 6 meses.");
  await page.getByLabel("Plazo de ejecución (días)").fill("3");
  await page.getByLabel("Validez de la cotización (días)").fill("10");
  await page.locator('form button[type="submit"]').click();
  await expect(page.getByText("Cotización enviada")).toBeVisible();

  await loginAsDemo(page, "cliente");
  await page.goto("/panel/solicitudes");
  await page.getByText(ref).first().click();
  await expect(page.getByRole("table")).toContainText("$90.000");
  await page.getByRole("button", { name: "Aceptar" }).click();
  await expect(page.getByText("Aceptada").first()).toBeVisible();
  const detailUrl = page.url();

  // PR-028: chat cliente-proveedor (en modo demo se actualiza por polling).
  await page.getByLabel("Escribe un mensaje").fill(`¿Pueden venir el lunes? ${ref}`);
  await page.getByRole("button", { name: "Enviar mensaje" }).click();
  await expect(page.getByLabel("Historial de mensajes")).toContainText(
    `¿Pueden venir el lunes? ${ref}`,
  );

  await loginAsDemo(page, "proveedor");
  await page.goto("/panel/proveedor/bandeja");
  await expect(page.locator("section.space-y-3", { hasText: "Mis trabajos" })).toContainText(ref);
  await page.goto(detailUrl);
  await expect(page.getByLabel("Historial de mensajes")).toContainText(
    `¿Pueden venir el lunes? ${ref}`,
  );
  await page.getByLabel("Escribe un mensaje").fill("Sí, el lunes a las 10:00");
  await page.getByRole("button", { name: "Enviar mensaje" }).click();
  await expect(page.getByLabel("Historial de mensajes")).toContainText("Sí, el lunes a las 10:00");
  await page.getByRole("button", { name: "Marcar en ejecución" }).click();
  await page.getByRole("button", { name: "Marcar como completada" }).click();
  await expect(page.getByText("Esperando la confirmación del cliente.")).toBeVisible();

  await loginAsDemo(page, "cliente");
  await page.goto(detailUrl);
  await page.getByRole("button", { name: "Confirmar trabajo realizado" }).click();
  await expect(page.getByText(/Trabajo confirmado/)).toBeVisible();
});

test("solicitud directa desde el perfil de una empresa llega a su bandeja", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Se valida una vez en escritorio");
  const ref = `directa-${Date.now()}`;

  await loginAsDemo(page, "cliente");
  await page.goto("/proveedor/p-hogar-fresco");
  await page.getByRole("button", { name: "Pedir cotización" }).click();
  await page.getByLabel("Describe tu requerimiento").fill(`Necesito mantención de split ${ref}`);
  await page.getByLabel("Comuna").selectOption("Macul");
  await page.getByRole("button", { name: /Enviar solicitud a/ }).click();
  await expect(page.getByText("Solicitud enviada")).toBeVisible();

  await loginAsDemo(page, "proveedor");
  await page.goto("/panel/proveedor/bandeja");
  const card = page.getByText(ref).first();
  await expect(card).toBeVisible();
  await expect(page.getByText("Directa a tu empresa").first()).toBeVisible();
});

test("PR-024 SOL-05 cancelar exige un motivo de la lista", async ({ page, isMobile }) => {
  test.skip(isMobile, "Se valida una vez en escritorio");
  const ref = `cancelar-${Date.now()}`;

  await loginAsDemo(page, "cliente");
  await page.goto("/panel/solicitudes/nueva");
  await page
    .getByLabel("Descripción del problema o servicio")
    .fill(`Solicitud que se cancelará ${ref}`);
  await page.getByLabel("Comuna").selectOption("Macul");
  await page.getByRole("button", { name: "Publicar solicitud" }).click();
  await expect(page).toHaveURL(/\/panel\/solicitudes$/);
  await page.getByText(ref).first().click();

  await page.getByRole("button", { name: "Cancelar solicitud" }).click();
  const confirm = page.getByRole("button", { name: "Confirmar cancelación" });
  await expect(confirm).toBeDisabled();
  await page.getByLabel(/Motivo de la cancelación/).selectOption("otro");
  await expect(confirm).toBeDisabled();
  await page.getByLabel(/Cuéntanos el motivo/).fill("Me cambié de domicilio");
  await confirm.click();
  await expect(page.getByTestId("cancel-reason-text")).toContainText(
    "Motivo: Otro: Me cambié de domicilio",
  );
});
