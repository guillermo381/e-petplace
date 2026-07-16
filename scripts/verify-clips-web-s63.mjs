// Smoke S63-B (Sesión B, bloque video): la ruta /adiestramiento/clips monta en web y habla es/en.
import { chromium } from 'playwright-core';

const PUERTO = process.env.PORT_PRESTADOR ?? '8085';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
let fallos = 0;

for (const esc of [
  { locale: 'es-EC', espera: ['Clips de la sesión', 'Grabar clip', 'hasta 3 por sesión'] },
  { locale: 'en-US', espera: ['Session clips', 'Record clip', 'up to 3 per session'] },
]) {
  const ctx = await browser.newContext({ locale: esc.locale, viewport: { width: 420, height: 900 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => localStorage.removeItem('epetplace.idioma'));
  await page.goto(`http://localhost:${PUERTO}/adiestramiento/clips`, { waitUntil: 'networkidle', timeout: 180000 });
  const cuerpo = await page.locator('body').innerText();
  for (const texto of esc.espera) {
    const ok = cuerpo.includes(texto);
    console.log(`  [${esc.locale}] ${ok ? '✓' : '✗ FALTA'} "${texto}"`);
    if (!ok) fallos += 1;
  }
  await ctx.close();
}
await browser.close();
console.log(fallos === 0 ? 'SMOKE CLIPS: 0 fallos' : `SMOKE CLIPS: ${fallos} fallos`);
process.exit(fallos === 0 ? 0 : 1);
