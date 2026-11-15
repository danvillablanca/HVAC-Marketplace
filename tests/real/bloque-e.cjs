// Ciclo completo de una solicitud contra Supabase local (DEMO_MODE=false).
const { chromium } = require(process.env.REPO + "/node_modules/@playwright/test");
const { execSync } = require("node:child_process");
const BASE = process.env.BASE_URL ?? "http://localhost:5273";
const STAMP = Date.now();
const sql = (q) =>
  execSync(`docker exec ${process.env.DB} psql -U postgres -tA -c "${q.replace(/"/g, '\\"')}"`).toString().trim();

(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const results = [];
  async function step(name, fn) {
    let status = "OK", note = "";
    try { note = (await fn()) ?? ""; } catch (e) { status = "FAIL"; note = e.message.split("\n")[0].slice(0, 220); }
    const alerts = (await page.locator('[role="alert"]').allInnerTexts().catch(() => [])).filter(Boolean);
    console.log(`[${status}] ${name} | ${page.url().replace(BASE, "")} ${note ? "| " + note : ""}${alerts.length ? " | alerts=" + JSON.stringify(alerts) : ""}`);
    results.push(status);
  }
  const expectText = (re, timeout = 10000) =>
    page.waitForFunction((s) => new RegExp(s, "i").test(document.body.innerText), re.source, { timeout });
  async function login(email) {
    await page.goto(BASE + "/ingresar");
    await page.fill("#email", email);
    await page.fill("#password", "demo1234");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/panel\//, { timeout: 10000 });
  }
  async function logout() {
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: /salir/i }).first().click();
    await page.waitForTimeout(800);
  }
  async function quote(amount) {
    await page.goto(BASE + "/panel/proveedor/bandeja");
    await expectText(new RegExp(String(STAMP)));
    const card = page.locator("section", { hasText: "Disponibles para cotizar" }).getByText(new RegExp(String(STAMP)));
    const cardText = await card.first().locator("xpath=ancestor::div[contains(@class,'rounded')][1]").innerText();
    await card.first().click();
    await page.waitForSelector("#amount");
    const shown = await page.innerText("main");
    if (shown.includes("Irarrázaval")) throw new Error("se ve la dirección antes de adjudicar");
    await page.fill("#amount", String(amount));
    await page.fill("#scope", `Instalación completa con materiales, garantía de 6 meses (${amount}).`);
    await page.fill("#deadline", "3");
    await page.fill("#valid", "10");
    await page.locator('form button[type="submit"]').click();
    await expectText(/Cotización enviada/);
    return cardText.replace(/\s+/g, " ").slice(0, 120);
  }

  let requestId = "";
  await login("cliente@demo.cl");
  await step("PR-020 cliente crea solicitud con servicio y comuna", async () => {
    await page.goto(BASE + "/panel/solicitudes/nueva");
    await page.selectOption("#serviceId", { label: "Venta e instalacion de equipos Split" });
    await page.selectOption("#equipment", "split");
    await page.selectOption("#urgency", "alta");
    await page.fill("#description", `Instalar split de 12.000 BTU en dormitorio, ref ${STAMP}.`);
    await page.selectOption("#commune", "Ñuñoa");
    await page.getByRole("button", { name: "Publicar solicitud" }).click();
    await page.waitForURL(/\/panel\/solicitudes$/, { timeout: 10000 });
    requestId = sql(`select id from service_requests where description like '%${STAMP}%'`);
    sql(`update service_requests set address='Av. Irarrázaval 1234' where id='${requestId}'`);
    return "geom=" + sql(`select geom is not null from service_requests where id='${requestId}'`);
  });
  await step("PR-021 se notificó a los proveedores elegibles", async () => {
    return sql(`select string_agg(u.email, ', ' order by u.email) from notifications n join auth.users u on u.id=n.user_id where n.ref_id='${requestId}' and n.type='nueva_solicitud'`);
  });
  await logout();

  await login("proveedor@demo.cl");
  await step("PR-022/025 proveedor 1 ve comuna y distancia (sin dirección) y cotiza", () => quote(90000));
  await logout();
  await login("proveedor2@demo.cl");
  await step("PR-025 proveedor 2 cotiza", () => quote(80000));
  await logout();

  await login("cliente@demo.cl");
  await step("PR-026 cliente compara las 2 cotizaciones lado a lado", async () => {
    await page.goto(BASE + "/panel/solicitudes/" + requestId);
    await expectText(/Menor precio/);
    const rows = await page.locator("table tbody tr").count();
    const table = (await page.locator("table").innerText()).replace(/\s+/g, " ");
    if (rows !== 2) throw new Error("filas=" + rows);
    return table.slice(0, 200);
  });
  await step("PR-026 RN-05 acepta la de proveedor 1; la otra queda rechazada", async () => {
    const row = page.locator("table tbody tr", { hasText: "Hogar Fresco" });
    await row.getByRole("button", { name: "Aceptar" }).click();
    await expectText(/Aceptada/);
    return sql(`select string_agg(p.legal_name||'='||q.status, ', ') from quotes q join providers p on p.id=q.provider_id where q.request_id='${requestId}'`);
  });
  await step("PR-011 RN-10 el cliente ahora ve el contacto del adjudicado", async () => {
    await page.goto(BASE + "/proveedor/p-hogar-fresco");
    await page.waitForTimeout(2000);
    const body = await page.innerText("body");
    if (/se muestran cuando aceptas/.test(body)) throw new Error("contacto sigue oculto");
    return body.match(/\+56[\d\s]+/)?.[0] ?? "teléfono no visible";
  });
  await logout();

  await login("proveedor2@demo.cl");
  await step("NOT-01/SOL-03 proveedor 2: aviso de no seleccionada y fuera de su bandeja", async () => {
    await page.getByRole("button", { name: /notificaci/i }).first().click();
    await expectText(/no fue seleccionada/);
    await page.keyboard.press("Escape");
    await page.goto(BASE + "/panel/proveedor/bandeja");
    await page.waitForTimeout(2000);
    if ((await page.innerText("main")).includes(String(STAMP))) throw new Error("aún aparece");
  });
  await logout();

  await login("proveedor@demo.cl");
  await step("PR-027 proveedor 1: en 'Mis trabajos', ve la dirección e inicia", async () => {
    await page.goto(BASE + "/panel/proveedor/bandeja");
    await page.locator("section", { hasText: "Mis trabajos" }).getByText(new RegExp(String(STAMP))).first().click();
    await page.waitForURL(/\/panel\/solicitudes\//);
    await expectText(/Irarrázaval/);
    await page.getByRole("button", { name: "Marcar en ejecución" }).click();
    await expectText(/En ejecución/);
  });
  await step("PR-027 proveedor 1 completa", async () => {
    await page.getByRole("button", { name: "Marcar como completada" }).click();
    await expectText(/Esperando la confirmación del cliente/);
  });
  await logout();

  await login("cliente@demo.cl");
  await step("PR-027 COT-03 cliente confirma y se habilita la reseña", async () => {
    await page.goto(BASE + "/panel/solicitudes/" + requestId);
    await page.getByRole("button", { name: "Confirmar trabajo realizado" }).click();
    await expectText(/Trabajo confirmado/);
    await expectText(/Deja tu reseña/);
    return sql(`select string_agg(to_status::text, ' > ' order by created_at) from service_request_events where request_id='${requestId}'`);
  });
  await step("PR-024 SOL-05 cancelar otra solicitud con motivo obligatorio y filtrar historial", async () => {
    await page.goto(BASE + "/panel/solicitudes/nueva");
    await page.fill("#description", `Solicitud que se cancelará, ref ${STAMP}-b.`);
    await page.selectOption("#commune", "Macul");
    await page.getByRole("button", { name: "Publicar solicitud" }).click();
    await page.waitForURL(/\/panel\/solicitudes$/);
    await page.getByText(`${STAMP}-b`).first().click();
    await page.getByRole("button", { name: "Cancelar solicitud" }).click();
    await page.selectOption("#cancel-reason", "otro");
    await page.fill("#cancel-detail", "Ya lo resolví por mi cuenta");
    await page.getByRole("button", { name: "Confirmar cancelación" }).click();
    await expectText(/Motivo: Otro: Ya lo resolví por mi cuenta/);
    await page.goto(BASE + "/panel/solicitudes");
    await page.selectOption("#status-filter", "cancelada");
    await page.waitForTimeout(500);
    const list = await page.innerText("main");
    if (!list.includes(`${STAMP}-b`) || list.includes(`ref ${STAMP}.`)) throw new Error("filtro incorrecto");
  });
  console.log(`\nTOTAL: ${results.filter((r) => r === "OK").length}/${results.length} OK`);
  await browser.close();
})();
