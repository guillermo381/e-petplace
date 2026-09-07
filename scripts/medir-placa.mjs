/**
 * ⭐ **LA PLACA SIN ACTIVAR** (S113-C · fase 3 · C4) — sus tres estados.
 *
 * 🔴 **El rojo que importa es de PRIVACIDAD**: un código sin activar **no dice
 * nada de nadie**. Se mide que la pantalla no nombre una mascota ni una familia
 * — *si lo hiciera, una chapita impresa se volvería una consulta abierta sobre
 * quién vive dónde.*
 */
import { chromium } from 'playwright-core';
const nav = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const di = (s) => console.log(s);

/* ① SIN SESIÓN — el caso de quien encuentra la placa en la calle. */
{
  const page = await nav.newPage({ viewport: { width: 420, height: 900 }, locale: 'es-EC' });
  await page.goto('http://localhost:8082/placa/token-inventado-para-medir', { waitUntil: 'networkidle', timeout: 300000 });
  await page.waitForTimeout(9000);
  const t = await page.evaluate(() => document.body.innerText);
  di('── SIN SESIÓN, token que no existe ──');
  /* 🔴 **SIN SESIÓN NO SE PUEDE SABER SI LA PLACA ES NUESTRA**, y el arnés
     lo aprendió midiendo: `estado_de_placa` exige sesión. Lo correcto acá es
     que NO opine sobre la placa y ofrezca la suya. */
  di(`  NO opina sobre la placa: ${/no es una placa de e-PetPlace/.test(t) ? '🔴 opina sin poder saber' : 'sí ✓'}`);
  di(`  nombra alguna mascota  : ${/Thor|Zeus|Lolo|Sombra/.test(t) ? '🔴 SÍ' : 'no ✓'}`);
  di(`  ofrece la tienda       : ${/Quiero una placa/.test(t) ? 'sí ✓' : '🔴 no'}`);
  await page.screenshot({ path: 'docs/loop/capturas-s113-c-f3/placa-sin-sesion.png' });
  await page.close();
}

/* ② CON SESIÓN — el caso de quien la compró. */
{
  const page = await nav.newPage({ viewport: { width: 420, height: 900 }, locale: 'es-EC' });
  await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 300000 });
  for (let i = 0; i < 240 && (await page.locator('input[type="password"]').count()) === 0; i += 1) await page.waitForTimeout(1000);
  await page.locator('input[type="email"]').fill(process.env.CLIENTE_EMAIL ?? '');
  await page.locator('input[type="password"]').fill(process.env.CLIENTE_PASSWORD ?? '');
  await page.getByText(/^(Entrar|Sign in)$/).first().click();
  await page.waitForTimeout(18000);
  await page.goto('http://localhost:8082/placa/token-inventado-para-medir', { waitUntil: 'networkidle' });
  await page.waitForTimeout(9000);
  const t = await page.evaluate(() => document.body.innerText);
  di('\n── CON SESIÓN, mismo token ──');
  /* ⚠️ **Con sesión, un token INEXISTENTE se ofrece para activar.** Medido
     contra la base: `estado_de_placa` devuelve `libre` y **no distingue «existe
     y está libre» de «no existe»**. *La pantalla no puede curarlo: sin ese
     dato, cualquier cadena de texto parece una placa virgen.* Pasa a A.
     Que liste mascotas acá es lo correcto DADO lo que el motor contesta. */
  di(`  lista mascotas p/ elegir: ${/Thor|Zeus|Lolo|Sombra/.test(t) ? 'sí (ver la nota de A abajo)' : 'no'}`);
  di(`  «no tienes mascotas»   : ${/no tienes ninguna mascota/i.test(t) ? '🔴 lo dice sin haber podido leer' : 'no ✓'}`);
  await page.screenshot({ path: 'docs/loop/capturas-s113-c-f3/placa-con-sesion.png' });
  await page.close();
}
di('');
di('🔴 PARA A · `estado_de_placa` devuelve `libre` para un token que NO EXISTE.');
di('   No distingue «existe y está libre» de «no existe», así que con sesión');
di('   cualquier cadena se ofrece para activar. La pantalla no puede curarlo.');
await nav.close();
