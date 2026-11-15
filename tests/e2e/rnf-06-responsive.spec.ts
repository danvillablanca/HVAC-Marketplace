import { expect, test, type Page } from "@playwright/test";
import { loginAsDemo, type DemoRole } from "./helpers";

/**
 * RNF-06: la interfaz es usable desde 360 px de ancho, sin scroll horizontal.
 * Cada prueba adjunta una captura de página completa (carpeta `test-results/`).
 */

const VIEWPORT = { width: 360, height: 740 };

const PAGES: { name: string; path: string; as?: DemoRole }[] = [
  { name: "inicio", path: "/" },
  { name: "buscar", path: "/buscar" },
  { name: "mapa", path: "/mapa" },
  { name: "proveedor", path: "/proveedor/p-hogar-fresco" },
  { name: "registro", path: "/registro" },
  { name: "ingresar", path: "/ingresar" },
  { name: "privacidad", path: "/privacidad" },
  { name: "panel-cliente", path: "/panel/solicitudes", as: "cliente" },
  { name: "nueva-solicitud", path: "/panel/solicitudes/nueva", as: "cliente" },
  { name: "panel-proveedor", path: "/panel/proveedor", as: "proveedor" },
  { name: "bandeja-proveedor", path: "/panel/proveedor/bandeja", as: "proveedor" },
  { name: "admin-verificaciones", path: "/panel/admin/verificaciones", as: "admin" },
];

/** Píxeles de desborde horizontal y los elementos que se salen del ancho de la ventana. */
async function horizontalOverflow(page: Page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const width = doc.clientWidth;
    const offenders = Array.from(document.querySelectorAll("body *"))
      .filter((el) => el.getBoundingClientRect().right > width + 1)
      .slice(-5)
      .map((el) => {
        const cls = typeof el.className === "string" ? el.className.slice(0, 80) : "";
        return `${el.tagName.toLowerCase()}.${cls} (${Math.round(el.getBoundingClientRect().right)}px)`;
      });
    return { overflow: doc.scrollWidth - width, offenders };
  });
}

test.describe("RNF-06 interfaz responsiva a 360 px", () => {
  test.use({ viewport: VIEWPORT });

  for (const p of PAGES) {
    test(`RNF-06 ${p.name} sin scroll horizontal`, async ({ page }, info) => {
      test.skip(info.project.name !== "chromium", "un solo navegador basta");
      if (p.as) await loginAsDemo(page, p.as);
      await page.goto(p.path);
      await page.waitForLoadState("networkidle");
      await expect(page.locator("main, #root").first()).toBeVisible();

      await page.screenshot({ path: info.outputPath(`rnf-06-${p.name}.png`) });
      const { overflow, offenders } = await horizontalOverflow(page);
      expect(
        overflow,
        `${p.path} desborda en 360 px: ${offenders.join(" | ")}`,
      ).toBeLessThanOrEqual(0);
    });
  }
});
