// Recorrido del Bloque B contra Supabase local (DEMO_MODE=false).
const { chromium } = require(process.env.REPO + "/node_modules/@playwright/test");
const { execSync } = require("node:child_process");
const BASE = process.env.BASE_URL ?? "http://localhost:5273";
const MAILPIT = "http://127.0.0.1:54324";
const STAMP = Date.now();
const sql = (q) =>
  execSync(`docker exec ${process.env.DB} psql -U postgres -tA -c "${q.replace(/"/g, '\\"')}"`).toString().trim();

(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext()).newPage();
  const results = [];
  async function step(name, fn) {
    let status = "OK", note = "";
    try { note = (await fn()) ?? ""; } catch (e) { status = "FAIL"; note = e.message.split("\n")[0].slice(0, 200); }
    const alerts = (await page.locator('[role="alert"]').allInnerTexts().catch(() => [])).filter(Boolean);
    console.log(`[${status}] ${name} | ${page.url().replace(BASE, "")} ${note ? "| " + note : ""}${alerts.length ? " | alerts=" + JSON.stringify(alerts) : ""}`);
    results.push(status);
  }
  const expectText = (re) => page.waitForFunction((s) => new RegExp(s, "i").test(document.body.innerText), re.source, { timeout: 10000 });
  async function login(email, password) {
    await page.goto(BASE + "/ingresar");
    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.click('button[type="submit"]');
  }
  async function logout() {
    await page.getByRole("button", { name: /salir/i }).first().click();
    await page.waitForTimeout(800);
  }

  const email = `nuevo.${STAMP}@test.cl`;
  await step("PR-001 registro sin aceptar términos muestra error", async () => {
    await page.goto(BASE + "/registro");
    await page.fill("#fullName", "Ñandú Pérez");
    await page.fill("#email", email);
    await page.fill("#password", "clave1234");
    await page.click('button[type="submit"]');
    await expectText(/Debes aceptar los terminos/);
  });
  await step("PR-001 registro con términos crea la cuenta y entra al panel", async () => {
    await page.check("#acceptTerms");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/panel\/solicitudes/, { timeout: 10000 });
    await expectText(/Hola, Ñandú/);
    return "profiles: " + sql(`select role||' | '||full_name||' | terms='||(accepted_terms_at is not null) from public.profiles where email='${email}'`);
  });
  await logout();

  await step("PR-002 login real cliente@demo.cl con datos del seed", async () => {
    await login("cliente@demo.cl", "demo1234");
    await page.waitForURL(/\/panel\/solicitudes/, { timeout: 10000 });
    await expectText(/Hola, Camila/);
    await page.waitForTimeout(1500);
    return (await page.locator("main").innerText()).replace(/\s+/g, " ").slice(0, 160);
  });
  await logout();

  await step("PR-002 credenciales inválidas: mensaje genérico", async () => {
    await login("cliente2@demo.cl", "malaclave1");
    await expectText(/Correo o contraseña incorrectos/);
  });
  await step("PR-002 bloqueo al 6° intento y también con la clave correcta", async () => {
    for (let i = 0; i < 4; i++) {
      await page.fill("#password", "malaclave1");
      await page.click('button[type="submit"]');
      await page.waitForTimeout(700);
    }
    await page.fill("#password", "demo1234");
    await page.click('button[type="submit"]');
    await expectText(/Demasiados intentos fallidos/);
    return "login_attempts: " + sql("select count(*) from public.login_attempts where email='cliente2@demo.cl' and not success");
  });

  await step("PR-003 recuperar contraseña envía correo", async () => {
    sql("delete from public.login_attempts");
    await fetch(MAILPIT + "/api/v1/messages", { method: "DELETE" });
    await page.goto(BASE + "/recuperar");
    await page.fill("#email", "proveedor2@demo.cl");
    await page.click('button[type="submit"]');
    await expectText(/te enviamos un enlace/);
    for (let i = 0; i < 20; i++) {
      const list = await (await fetch(MAILPIT + "/api/v1/messages")).json();
      if (list.messages?.length) return "correo: " + list.messages[0].Subject;
      await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error("no llegó el correo a Mailpit");
  });
  await step("PR-003 enlace del correo permite fijar nueva contraseña", async () => {
    const list = await (await fetch(MAILPIT + "/api/v1/messages")).json();
    const msg = await (await fetch(`${MAILPIT}/api/v1/message/${list.messages[0].ID}`)).json();
    const link = (msg.HTML || msg.Text).match(/https?:\/\/[^"'\s<>]+verify[^"'\s<>]+/)[0].replace(/&amp;/g, "&");
    const res = await page.request.get(link, { maxRedirects: 0 });
    const location = res.headers()["location"];
    if (!location || !location.includes("access_token")) throw new Error("redirect sin token: " + location);
    await page.goto(location.replace(/^https?:\/\/[^/]+/, BASE).replace(/^(.*?)(\/?#)/, (m, a) => (a.endsWith("/restablecer") ? a : BASE + "/restablecer") + "#"));
    await page.waitForSelector("#password", { timeout: 10000 });
    await page.fill("#password", "corta");
    await page.fill("#confirm", "corta");
    await page.click('button[type="submit"]');
    await expectText(/Minimo 8 caracteres/);
    await page.fill("#password", "nueva12345");
    await page.fill("#confirm", "nueva12345");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/ingresar/, { timeout: 10000 });
    await expectText(/Tu contraseña se actualizó/);
  });
  await step("PR-003 ingresa con la contraseña nueva", async () => {
    await login("proveedor2@demo.cl", "nueva12345");
    await page.waitForURL(/\/panel\/proveedor/, { timeout: 10000 });
  });
  await step("PR-004 proveedor no entra a la bandeja de admin", async () => {
    await page.goto(BASE + "/panel/admin/verificaciones");
    await page.waitForTimeout(1500);
    if (/Bandeja de verificacion/.test(await page.innerText("body"))) throw new Error("vio la bandeja admin");
  });
  await logout();
  await step("PR-004 admin ve la cola real de verificación", async () => {
    await login("admin@demo.cl", "demo1234");
    await page.waitForURL(/admin\/verificaciones/, { timeout: 10000 });
    await page.waitForTimeout(2000);
    return (await page.locator("main").innerText()).replace(/\s+/g, " ").slice(0, 220);
  });
  await step("PR-005 logout invalida la sesión en el servidor", async () => {
    await logout();
    await page.goto(BASE + "/panel/admin/verificaciones");
    await page.waitForTimeout(1500);
    if (!/Bienvenido de vuelta/.test(await page.innerText("body"))) throw new Error("sigue con sesión");
    return "sesiones activas admin: " + sql("select count(*) from auth.sessions s join auth.users u on u.id=s.user_id where u.email='admin@demo.cl'");
  });

  console.log(`\nTOTAL: ${results.filter((r) => r === "OK").length}/${results.length} OK`);
  await browser.close();
})();
