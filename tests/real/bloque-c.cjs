// Recorrido del Bloque C contra Supabase local (DEMO_MODE=false).
const { chromium } = require(process.env.REPO + "/node_modules/@playwright/test");
const { execSync } = require("node:child_process");
const BASE = process.env.BASE_URL ?? "http://localhost:5273";
const STAMP = Date.now();
const NAME = `Clima Prueba ${STAMP}`;
function rut(n) {
  let sum = 0, m = 2;
  for (const d of String(n).split("").reverse()) { sum += Number(d) * m; m = m === 7 ? 2 : m + 1; }
  const r = 11 - (sum % 11);
  return `${n}-${r === 11 ? "0" : r === 10 ? "K" : r}`;
}
const RUT = rut(70000000 + (STAMP % 9999999));
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
  const nav = () => page.locator('nav[aria-label="Principal"]').innerText();
  async function login(email, password = "demo1234") {
    await page.goto(BASE + "/ingresar");
    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/panel\//, { timeout: 10000 });
  }
  async function logout() {
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: /salir/i }).first().click();
    await page.waitForTimeout(800);
  }

  const email = `prov.${STAMP}@test.cl`;
  await step("Visitante ve 'Para proveedores' en el navbar", async () => {
    await page.goto(BASE);
    if (!/Para proveedores/.test(await nav())) throw new Error("no aparece");
  });
  await step("Registro de proveedor nuevo", async () => {
    await page.goto(BASE + "/registro");
    await page.fill("#fullName", NAME);
    await page.fill("#email", email);
    await page.selectOption("#role", "proveedor");
    await page.fill("#rut", RUT);
    await page.fill("#phone", "+56 9 4444 5555");
    await page.fill("#password", "clave1234");
    await page.check("#acceptTerms");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/panel\/proveedor/, { timeout: 10000 });
    await expectText(/Completa el perfil de tu empresa/);
  });
  await step("Con sesión, el navbar ya no muestra 'Para proveedores'", async () => {
    if (/Para proveedores/.test(await nav())) throw new Error("sigue apareciendo");
  });
  await step("Dashboard: estado 'Sin verificar' (no 'Verificado')", async () => {
    await expectText(/Sin verificar/);
  });
  await step("'Completar perfil' lleva al formulario, no a /para-proveedores", async () => {
    await page.getByRole("link", { name: "Completar perfil" }).first().click();
    await page.waitForURL(/\/panel\/proveedor\/perfil$/);
  });
  await step("PR-007/008/009/012 guarda perfil con servicios, cobertura y horario", async () => {
    await page.fill("#legalName", NAME);
    await page.fill("#rut", RUT);
    await page.fill("#phone", "+56 9 4444 5555");
    await page.selectOption("#segment", "residencial");
    await page.fill("#yearsExperience", "6");
    await page.fill("#description", "Instalación y mantención de equipos split en el sector oriente.");
    await page.selectOption("#commune", "Ñuñoa");
    await page.locator("#coverageRadiusKm").fill("25");
    await page.getByLabel("Venta e instalacion de equipos Split", { exact: true }).check();
    await page.getByLabel("Precio desde para Venta e instalacion de equipos Split").fill("85000");
    await page.getByLabel("Reparacion y carga de gas", { exact: true }).check();
    await page.getByRole("button", { name: /Guardar perfil/ }).click();
    await expectText(/Perfil guardado/);
    return sql(`select p.verification_status||' | radio='||p.coverage_radius_km||' | servicios='||(select count(*) from provider_services ps where ps.provider_id=p.id)||' | '||l.commune||' ('||round(l.lat::numeric,3)||')' from providers p join locations l on l.provider_id=p.id where p.legal_name='${NAME}'`);
  });
  await step("Recargar conserva los servicios elegidos", async () => {
    await page.reload();
    await page.waitForSelector("#legalName");
    await page.waitForTimeout(800);
    const checked = await page.getByLabel("Venta e instalacion de equipos Split", { exact: true }).isChecked();
    const price = await page.getByLabel("Precio desde para Venta e instalacion de equipos Split").inputValue();
    if (!checked || price !== "85000") throw new Error(`checked=${checked} price=${price}`);
  });
  await step("PR-013 envía la verificación (datos tomados del perfil)", async () => {
    await page.goto(BASE + "/panel/proveedor/verificacion");
    await page.waitForTimeout(1000);
    const legal = await page.inputValue("#legalName");
    if (legal !== NAME) throw new Error("no se prellenó la razón social: " + legal);
    await page.getByRole("button", { name: /Continuar/ }).click();
    for (const cb of await page.locator('input[type="checkbox"][id^="doc-"]').all()) await cb.check();
    await page.getByRole("button", { name: /Continuar/ }).click();
    await page.getByRole("button", { name: /Enviar a revision/ }).click();
    await expectText(/Solicitud en revision/);
    return sql(`select verification_status||' | items='||(select count(*) from verification_items v where v.provider_id=p.id) from providers p where legal_name='${NAME}'`);
  });
  await step("Aún no aparece en la búsqueda pública", async () => {
    return "en nearby: " + sql(`select count(*) from nearby_providers(-33.456,-70.598,30,null,null,'${NAME}',10,0)`);
  });
  await logout();

  await step("PR-014 admin ve al proveedor en la cola y lo aprueba", async () => {
    await login("admin@demo.cl");
    await expectText(new RegExp(String(STAMP)));
    const row = page.locator("tr", { hasText: String(STAMP) });
    await row.getByRole("button", { name: "Aprobar" }).click();
    await page.waitForTimeout(1500);
    return sql(`select verification_status||' | verified_at='||(verified_at is not null)||' | audit='||(select count(*) from audit_log a where a.entity_id=p.id) from providers p where legal_name='${NAME}'`);
  });
  await logout();

  await step("NOT-01 el proveedor recibe la notificación y ve 'Verificado'", async () => {
    await login(email, "clave1234");
    await expectText(/Verificado/);
    await page.getByRole("button", { name: /notificaci/i }).first().click();
    await expectText(/Tu empresa fue verificada/);
  });
  await logout();

  await step("PR-015/016 aparece en la búsqueda pública cerca de Ñuñoa", async () => {
    const n = sql(`select count(*) from nearby_providers(-33.456,-70.598,30,null,null,'${STAMP}',10,0)`);
    if (n !== "1") throw new Error("nearby=" + n);
    await page.goto(BASE + "/buscar");
    await page.waitForTimeout(2500);
    return "lista /buscar: " + (await page.locator('ul[aria-label="Proveedores encontrados"] > li').count()) + " proveedores";
  });
  await step("PR-011 RN-10 el perfil público oculta teléfono y correo", async () => {
    const slug = sql(`select slug from providers where legal_name='${NAME}'`);
    await page.goto(BASE + "/proveedor/" + slug);
    await expectText(new RegExp(String(STAMP)));
    await expectText(/se muestran cuando aceptas una cotización/);
    const body = await page.innerText("body");
    if (body.includes("4444")) throw new Error("se ve el teléfono");
  });

  console.log(`\nTOTAL: ${results.filter((r) => r === "OK").length}/${results.length} OK`);
  await browser.close();
})();
