const { chromium } = require(process.env.REPO + "/node_modules/@playwright/test");
const BASE = process.env.BASE_URL ?? "http://localhost:5273";
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const tiles = new Set();
  page.on("request", (r) => { if (r.url().includes("tile.openstreetmap.org")) tiles.add(r.url().split("/").slice(0, 3).join("/")); });
  const results = [];
  const step = async (name, fn) => {
    let s = "OK", n = "";
    try { n = (await fn()) ?? ""; } catch (e) { s = "FAIL"; n = e.message.split("\n")[0].slice(0, 200); }
    console.log(`[${s}] ${name} ${n ? "| " + n : ""}`); results.push(s);
  };
  const count = () => page.locator("p[aria-live=polite]").first().innerText();
  const wait = () => page.waitForTimeout(1500);
  await step("BUS-02 radio por defecto 10 km desde el centro", async () => { await page.goto(BASE + "/buscar"); await wait(); return count(); });
  await step("BUS-03 paginación (radio 50 km)", async () => {
    await page.locator('input[type="range"]').fill("50"); await wait();
    const before = await count();
    await page.getByRole("button", { name: /Siguiente/ }).click(); await wait();
    return `${before} → ${await count()} | ${await page.getByText(/Página \d+ de \d+/).innerText()}`;
  });
  await step("BUS-01 comuna Valparaíso (región distinta)", async () => {
    await page.getByLabel("Región").selectOption("Valparaíso");
    await page.getByLabel("Comuna").selectOption("Viña del Mar"); await wait();
    const names = await page.locator('ul[aria-label="Proveedores encontrados"] h3, ul[aria-label="Proveedores encontrados"] [role=heading]').allInnerTexts();
    return (await count()) + " | " + names.slice(0, 3).join(", ");
  });
  await step("BUS-03 calificación mínima 4,5 + orden por calificación (RM, 50 km)", async () => {
    await page.getByLabel("Región").selectOption("Metropolitana de Santiago");
    await page.getByLabel("Comuna").selectOption("Santiago");
    await page.getByLabel("Calificación mínima").selectOption("4.5");
    await page.locator("#sort").selectOption("rating"); await wait();
    const text = await page.locator('ul[aria-label="Proveedores encontrados"]').innerText();
    const ratings = [...text.matchAll(/(\d\.\d) \(/g)].map((m) => Number(m[1]));
    if (ratings.some((r) => r < 4.5)) throw new Error("rating < 4.5: " + ratings);
    if (ratings.join() !== [...ratings].sort((a, b) => b - a).join()) throw new Error("no ordenado: " + ratings);
    return (await count()) + " | " + ratings.join(" ");
  });
  await step("BUS-03 solo disponibles", async () => {
    await page.getByLabel("Calificación mínima").selectOption("");
    const all = await count();
    await page.getByLabel(/Solo proveedores disponibles/).check(); await wait();
    return `${all} → ${await count()}`;
  });
  await step("BUS-03 filtro por servicio", async () => {
    await page.getByLabel("Servicio").selectOption({ label: "Salas limpias y laboratorios" }); await wait();
    return count();
  });
  await step("BUS-04 mapa con teselas raster de OpenStreetMap", async () => {
    await page.goto(BASE + "/mapa"); await page.waitForTimeout(4000);
    if (!tiles.size) throw new Error("no se pidieron teselas OSM");
    return [...tiles].join(", ") + " | marcadores=" + (await page.locator(".maplibregl-marker").count());
  });
  console.log(`\nTOTAL: ${results.filter((r) => r === "OK").length}/${results.length} OK`);
  await browser.close();
})();
