/* ②④ sobre THOR, que sí tiene peso y raza publicada. */
import { chromium } from 'playwright-core';
const nav = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const page = await nav.newPage({ viewport: { width: 420, height: 900 }, locale: 'es-EC' });
await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 300000 });
for (let i = 0; i < 240 && (await page.locator('input[type="password"]').count()) === 0; i += 1) await page.waitForTimeout(1000);
await page.locator('input[type="email"]').fill(process.env.CLIENTE_EMAIL);
await page.locator('input[type="password"]').fill(process.env.CLIENTE_PASSWORD);
await page.getByText(/^(Entrar|Sign in)$/).first().click();
await page.waitForTimeout(16000);
/* 🔴 **Directo a la ficha por URL.** Entrar por el Hogar dejaba el arnés
   midiendo la TARJETA de Thor —que también dice kg— mientras la ficha todavía
   no había montado. *El sujeto de la medición tiene que ser la pantalla que se
   quiere medir, no la que está a la vista.* */
await page.goto('http://localhost:8082/hogar/mascota/d2e31d70-54fc-4d47-b425-1617239257eb', { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForTimeout(4000);
/* 🔴 **Se espera A QUE EL DATO ESTÉ, no un rato fijo.** El peso se degrada al
   snapshot clínico mientras la serie carga —eso es correcto— así que un arnés
   apurado ve «11,4 kg» y canta rojo sobre una pantalla sana. *Un tiempo fijo
   mide la velocidad de la red, no la pieza.* */
let t = '';
for (let i = 0; i < 30; i += 1) {
  t = await page.evaluate(() => document.body.innerText);
  if (/kg · \d{2} \w+/.test(t)) break;
  if (i === 29) console.log(`   (a los 30s la ficha dice: «${t.slice(0, 120).replace(/\n/g, ' · ')}»)`);
  await page.waitForTimeout(1000);
}
/* Ahora el peso lleva TRES partes: número · fecha · quién lo pesó. */
/* La fecha corta lleva AÑO («04 sept 2026»): el regex de dos grupos daba rojo
   sobre un texto correcto. */
const m = /(\d+(?:[.,]\d+)?) kg · (\d{2} \w+ \d{4}) · (lo pesó la clínica|lo pesaste tú)/.exec(t);
const enc = /(\d+(?:[.,]\d+)?) kg(?! ·)/.exec(t);
console.log(`   encabezado del retrato: ${enc === null ? '(sin peso)' : `«${enc[0]}»`}`);
console.log(`② invitación: ${/qué (lo )?hace único/.test(t) ? 'sí ✓' : '🔴 no'}`);
console.log(`   crudo: ${(t.match(/[^\n]*\d+(?:[.,]\d+)? kg[^\n]*/g) ?? []).slice(0, 3).join(' ⁞ ')}`);
console.log(`④ peso con fecha: ${m !== null ? `«${m[0]}» ✓` : (/\d+(?:[.,]\d+)? kg/.test(t) ? `🔴 sin fecha — ${/(\d+(?:[.,]\d+)? kg)/.exec(t)?.[1]}` : 'no hay peso')}`);
console.log(`   ficha de raza: ${/Ver más sobre la raza/.test(t) ? 'sí ✓' : 'no'}`);
await nav.close();
