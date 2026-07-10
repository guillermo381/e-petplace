// Verificación runtime 2.1 (S51-B2): la BarraTabs de 3 tabs renderiza
// y navega — es/en vía riel. Temporal de sesión.
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'chrome', headless: true });

for (const [locale, labels] of [
  ['es-EC', ['Hogar', 'Explorar', 'Cuenta']],
  ['en-US', ['Home', 'Explore', 'Account']],
]) {
  const ctx = await browser.newContext({ locale, viewport: { width: 420, height: 900 } });
  const page = await ctx.newPage();
  // /explorar: única tab sin guard de sesión — el guard del Hogar
  // redirige a bienvenida sin login (correcto, verificado aparte).
  await page.goto('http://localhost:8082/explorar', { waitUntil: 'networkidle', timeout: 180000 });
  await page.waitForTimeout(4000);
  const texto = await page.evaluate(() => document.body.innerText);
  for (const l of labels) console.log(`[${locale}] ${texto.includes(l) ? '✓' : '✗ FALTA'} tab "${l}"`);
  // navegar a Cuenta y verificar que cambia la vista
  await page.getByText(labels[2], { exact: true }).first().click();
  await page.waitForTimeout(1500);
  const texto2 = await page.evaluate(() => document.body.innerText);
  const marca = locale === 'es-EC' ? 'Tu cuenta' : 'Your account';
  console.log(`[${locale}] ${texto2.includes(marca) ? '✓' : '✗ FALTA'} navegación → "${marca}"`);
  await page.screenshot({ path: `${process.env.SCRATCH}/tabs-${locale}.png` });
  await ctx.close();
}
await browser.close();
