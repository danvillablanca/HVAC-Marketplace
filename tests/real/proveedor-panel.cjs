// Solicitud directa desde el perfil de una empresa y panel del proveedor, contra Supabase local.
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
  const step = async (name, fn) => {
    let s = "OK", n = "";
    try { n = (await fn()) ?? ""; } catch (e) { s = "FAIL"; n = e.message.split("\n")[0].slice(0, 220); }
    console.log(`[${s}] ${name} ${n ? "| " + n : ""}`);
    results.push(s);
  };
  const login = async (email) => {
    await page.goto(BASE + "/ingresar");
    await page.fill("#email", email);
    await page.fill("#password", "demo1234");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/panel\//, { timeout: 10000 });
  };
  const logout = async () => {
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: /salir/i }).first().click();
    await page.waitForTimeout(800);
  };
  const navText = () => page.locator('nav[aria-label="Principal"]').innerText();

  await login("cliente@demo.cl");
  await step("Cliente pide cotización desde el perfil de Hogar Fresco", async () => {
    await page.goto(BASE + "/proveedor/p-hogar-fresco");
    await page.getByRole("button", { name: "Pedir cotización" }).click();
    await page.getByLabel("Describe tu requerimiento").fill(`Mantención de split del living ${STAMP}`);
    await page.getByLabel("Comuna").selectOption("Macul");
    await page.getByRole("button", { name: /Enviar solicitud a/ }).click();
    await page.getByText("Solicitud enviada").waitFor({ timeout: 10000 });
    return sql(
      `select sr.status||' | destino='||p.legal_name from service_requests sr join providers p on p.id=sr.target_provider_id where sr.description like '%${STAMP}%'`,
    );
  });
  await step("En 'Mis solicitudes' figura como directa", async () => {
    await page.goto(BASE + "/panel/solicitudes");
    await page.getByText(/Solicitud directa a Hogar Fresco/).first().waitFor({ timeout: 8000 });
  });
  await step("Navbar del cliente", async () => (await navText()).replace(/\s+/g, " "));
  await logout();

  await login("proveedor@demo.cl");
  await step("Panel del proveedor: nombre de la empresa y métricas propias", async () => {
    await page.getByText("Panel de proveedor").waitFor({ timeout: 8000 });
    const body = await page.innerText("main");
    for (const label of ["Por cotizar", "Cotizaciones enviadas", "Trabajos en curso", "Completados"]) {
      if (!body.includes(label)) throw new Error("falta métrica " + label);
    }
    await page.getByText("Verificado").first().waitFor({ timeout: 8000 });
    return (await page.getByRole("heading", { level: 1 }).innerText()).replace(/\s+/g, " ");
  });
  await step("Navbar del proveedor sin herramientas de cliente", async () => {
    const nav = (await navText()).replace(/\s+/g, " ");
    if (/Buscar proveedores|Mapa|Asistente/.test(nav)) throw new Error(nav);
    return nav;
  });
  await step("La solicitud directa aparece en el panel y en la bandeja", async () => {
    await page.getByText(String(STAMP)).first().waitFor({ timeout: 8000 });
    await page.goto(BASE + "/panel/proveedor/bandeja");
    await page.getByText(String(STAMP)).first().waitFor({ timeout: 8000 });
    await page.getByText("Directa a tu empresa").first().waitFor();
  });
  await step("El proveedor la cotiza", async () => {
    await page.getByText(String(STAMP)).first().click();
    await page.fill("#amount", "70000");
    await page.fill("#scope", "Mantención completa del split con limpieza de serpentines.");
    await page.fill("#deadline", "2");
    await page.fill("#valid", "10");
    await page.locator('form button[type="submit"]').click();
    await page.getByText("Cotización enviada").waitFor({ timeout: 8000 });
  });
  await logout();
  await login("proveedor2@demo.cl");
  await step("Otro proveedor no la ve", async () => {
    await page.goto(BASE + "/panel/proveedor/bandeja");
    await page.waitForTimeout(2000);
    if ((await page.innerText("main")).includes(String(STAMP))) throw new Error("la ve");
  });

  console.log(`\nTOTAL: ${results.filter((r) => r === "OK").length}/${results.length} OK`);
  await browser.close();
})();
