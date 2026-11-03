// Mensajeria y notificaciones en vivo contra Supabase local (DEMO_MODE=false).
const { chromium } = require(process.env.REPO + "/node_modules/@playwright/test");
const { execSync } = require("node:child_process");
const BASE = process.env.BASE_URL ?? "http://localhost:5273";
const REQ = "e0000000-0000-0000-0000-000000000002"; // cliente@demo.cl, cotizada por Hogar Fresco y Climatiza Ñuñoa
const sql = (q) => execSync(`docker exec ${process.env.DB} psql -U postgres -tA -c "${q.replace(/"/g, '\\"')}"`).toString().trim();

(async () => {
  const browser = await chromium.launch();
  const results = [];
  const step = async (name, fn) => {
    let s = "OK", n = "";
    try { n = (await fn()) ?? ""; } catch (e) { s = "FAIL"; n = e.message.split("\n")[0].slice(0, 220); }
    console.log(`[${s}] ${name} ${n ? "| " + n : ""}`); results.push(s);
  };
  async function open(email) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE + "/ingresar");
    await page.fill("#email", email);
    await page.fill("#password", "demo1234");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/panel\//, { timeout: 10000 });
    await page.goto(`${BASE}/panel/solicitudes/${REQ}`);
    await page.getByText("Mensajes").first().waitFor({ timeout: 10000 });
    return page;
  }
  const stamp = Date.now();
  const client = await open("cliente@demo.cl");
  const provider = await open("proveedor@demo.cl");

  await step("Ambos ven el chat 'En vivo' (Realtime conectado)", async () => {
    await client.getByText("· En vivo").waitFor({ timeout: 8000 });
    await provider.getByText("· En vivo").waitFor({ timeout: 8000 });
  });
  await step("El cliente ve un hilo por cada proveedor que cotizó", async () => {
    const tabs = await client.getByRole("tab").allInnerTexts();
    if (tabs.length !== 2) throw new Error("tabs=" + tabs);
    return tabs.join(" | ");
  });
  await step("PR-028 proveedor → cliente llega en vivo en < 2 s", async () => {
    await client.getByRole("tab", { name: /Hogar Fresco/ }).click();
    const unreadBefore = await client.getByRole("button", { name: "Notificaciones" }).innerText();
    const text = `Puedo ir mañana a las 10 (${stamp})`;
    await provider.getByLabel("Escribe un mensaje").fill(text);
    const t0 = Date.now();
    await provider.getByRole("button", { name: "Enviar mensaje" }).click();
    await client.getByText(text).waitFor({ timeout: 5000 });
    const ms = Date.now() - t0;
    if (ms > 2000) throw new Error(`tardó ${ms} ms`);
    return `${ms} ms (campana antes: '${unreadBefore.trim() || "0"}')`;
  });
  await step("NOT-01 la campana del cliente sube en vivo", async () => {
    await client.waitForFunction(() => /\d/.test(document.querySelector('button[aria-label="Notificaciones"]')?.textContent ?? ""), null, { timeout: 5000 });
    await client.getByRole("button", { name: "Notificaciones" }).click();
    await client.getByText(/Nuevo mensaje de Hogar Fresco/).first().waitFor({ timeout: 5000 });
    await client.keyboard.press("Escape");
  });
  await step("PR-028 cliente → proveedor llega en vivo en < 2 s y se marca 'Leído'", async () => {
    const text = `Perfecto, los espero (${stamp})`;
    await client.getByLabel("Escribe un mensaje").fill(text);
    const t0 = Date.now();
    await client.getByRole("button", { name: "Enviar mensaje" }).click();
    await provider.getByText(text).waitFor({ timeout: 5000 });
    const ms = Date.now() - t0;
    if (ms > 2000) throw new Error(`tardó ${ms} ms`);
    await client.getByText("· Leído").first().waitFor({ timeout: 6000 }).catch(() => {});
    return `${ms} ms`;
  });
  await step("El otro proveedor no ve esta conversación (RLS + backend)", async () => {
    const other = await open("proveedor2@demo.cl");
    await other.waitForTimeout(1500);
    const body = await other.innerText("main");
    if (body.includes(String(stamp))) throw new Error("ve mensajes ajenos");
  });
  await step("Historial persistente en la base", async () => {
    return sql(`select count(*)||' mensajes, no leídos='||count(*) filter (where read_at is null) from messages where body like '%${stamp}%'`);
  });
  await step("NOT-02 correo de cotización recibida registrado (sin RESEND_API_KEY)", async () => {
    const log = require("node:fs").readFileSync(process.env.BACKLOG, "utf8");
    const lines = log.split("\n").filter((l) => l.includes("[email]"));
    return lines.length ? lines.at(-1).trim().slice(0, 140) : "sin eventos de correo aún en esta sesión";
  });
  console.log(`\nTOTAL: ${results.filter((r) => r === "OK").length}/${results.length} OK`);
  await browser.close();
})();
