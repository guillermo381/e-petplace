/**
 * S91-D · CAPTURAS DE LA 2ª PASADA DEL GATE (A1 · A2 · A3).
 *
 * No es un verificador: es el instrumento de la captura. Los asserts de
 * estas pantallas viven en `verify-alta-mascota-web-s91.mjs` y siguen
 * siendo los que mandan — acá solo se fotografía lo que el founder pidió
 * mirar, porque **una cura de acabado se juzga viendo, no leyendo** (L-143).
 *
 * ⚠️ NAVEGA POR URL CON PARAMS, jamás tapeando el recorrido: es el camino
 * del verificador de al lado, y la razón es que un tap depende de la
 * etiqueta del CTA — que en este alta CAMBIA por especie (la cláusula del
 * pez llega a cambiar el verbo). Un capturador que tapea se cae cuando la
 * voz se afina, y entonces el rojo no dice nada del dibujo.
 *
 * A4 (la flecha del CTA de cierre) NO se captura acá a propósito: su Hoja
 * solo existe DESPUÉS de crear una mascota real, y este script no escribe.
 *
 * Uso: `npx expo start --web --port 8082` en apps/cliente, y después
 * `npx tsx scripts/capturar-tanda-a-s91.mjs`.
 */

import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';

const BASE = 'http://localhost:8082';
const SALIDA = 'scripts/capturas';

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

const main = async () => {
  await mkdir(SALIDA, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const ctx = await browser.newContext({
    locale: 'es-EC',
    viewport: { width: 420, height: 1100 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();

  const ir = async (ruta, aguja) => {
    await page.goto(`${BASE}${ruta}`, { waitUntil: 'networkidle' });
    await page.getByText(aguja, { exact: false }).first().waitFor({ timeout: 20000 });
    // El catálogo viaja por red: fotografiar antes es fotografiar el vacío
    // (mi propio error en G6 — la captura salió prematura y leí un genérico
    // donde el producto ya ponía la cara buena).
    await esperar(2200);
  };

  // ── A1: el selector de ESPECIE — la elección tiene que verse magenta ──
  await ir('/onboarding', '¿Quién se suma a tu casa?');
  await page.getByText('Perro', { exact: true }).first().click();
  await esperar(900);
  await page.screenshot({ path: `${SALIDA}/s91d-A1-especie-elegida.png`, fullPage: true });

  // ── A2: la grilla de razas montada sobre ChipEntidad ─────────────────
  await ir('/onboarding/raza?nombre=Zeus&especie=perro', '¿De qué raza es Zeus?');
  await page.screenshot({ path: `${SALIDA}/s91d-A2-chipentidad-razas.png`, fullPage: true });

  // el nombre largo, que es el caso que parió D-691
  await page.getByRole('textbox').first().fill('lab');
  await esperar(900);
  await page.screenshot({ path: `${SALIDA}/s91d-A2-filtro-tres-letras.png`, fullPage: true });

  await page.getByRole('radio').first().click();
  await esperar(700);
  await page.screenshot({ path: `${SALIDA}/s91d-A2-elegido-con-pata.png`, fullPage: true });

  // ── A3: el paso de la foto, camino galería ───────────────────────────
  await ir('/onboarding/foto?nombre=Zeus&especie=perro&razaSlug=labrador-retriever', 'Zeus');
  await page.screenshot({ path: `${SALIDA}/s91d-A3-foto-camino-galeria.png`, fullPage: true });

  console.log('capturas en', SALIDA);
  await browser.close();
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
