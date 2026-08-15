/**
 * verify-s99d-barra-vendedor-puro.mjs — EL VENDEDOR PURO RECIBE LA CASA (D-820).
 *
 * `LA_CASA_DEL_PRESTADOR` §2.0 (firma del founder, 14-ago): *«el vendedor
 * puro deja de ser el caso sin barra: es un DUEÑO y tiene la casa entera»*.
 * `PLAN_S99` §2 lo escribe como discriminador de cierre de L1: **`duenodes`
 * recibe la barra**.
 *
 * 🔴 **POR QUÉ ESTE INSTRUMENTO NO MIDE «hay tabs» Y LISTO.** El defecto no
 * era que faltara una tab: era que **la barra no existía en absoluto** y la
 * persona aterrizaba en una pantalla suelta. Un guard que solo contara tabs
 * daría verde el día que alguien monte una barra de una sola tab. Por eso
 * mide TRES cosas y las tres tienen que dar:
 *   ① **NO aterriza en `/ventas`** — el Redirect murió (era la línea exacta).
 *   ② **las CINCO tabs de §2.0 están, por su nombre accesible** — no por
 *      cantidad: un conteo de 5 con las tabs equivocadas es un verde falso.
 *   ③ **la ruta `/ventas` SIGUE VIVA** — la mitad que es fácil romper de
 *      paso. Es la casa del empleado-vendedor no-gestor de §0bis (costura 1
 *      de `PLAN_S99` §5, medición de C): matarla le saca el piso al mismo
 *      actor al que S96 ya se lo sacó una vez.
 *
 * 🔴 **EL PAR DISCRIMINADOR, y se corre a mano porque vale la pena decirlo:**
 * este script contra el commit ANTERIOR al cascarón tiene que dar ROJO en ①
 * y ② (aterriza en `/ventas`, cero tabs). Si diera verde antes y después, no
 * estaría midiendo la cura — estaría midiendo que la app abre.
 *
 * Mide RN-web sobre Metro, **no el dispositivo** (L-153): Android puede
 * repartir distinto y el gate del founder sigue siendo la única firma.
 *
 * Uso:  node scripts/verify-s99d-barra-vendedor-puro.mjs [--puerto 8082]
 *       CUENTA=…  CLAVE=…   (default: duenodes + clave del keychain)
 */
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';

const arg = (n, def) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 ? process.argv[i + 1] : def;
};
const PUERTO = arg('puerto', '8082');
const BASE = `http://localhost:${PUERTO}`;
const EMAIL = process.env.CUENTA || 'guillo381+duenodes@gmail.com';
const CLAVE =
  process.env.CLAVE ||
  execFileSync('security', [
    'find-generic-password',
    '-a',
    'siembra',
    '-s',
    'epetplace-siembra-s97',
    '-w',
  ])
    .toString()
    .trim();

/* Las cinco de §2.0, en su orden. Se buscan POR NOMBRE y no por cantidad:
   la barra las expone como `role=tab` con su etiqueta (`BarraTabs`). */
const CINCO = ['Hoy', 'Datos', 'Atender', 'Negocio', 'Cuenta'];

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();
const fallos = [];
const di = (s) => console.log(s);

try {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 180000 });
  await page.getByPlaceholder('ej: ana@correo.com').fill(EMAIL);
  await page.locator('input[type="password"]').fill(CLAVE);
  await page.getByText('Entrar', { exact: true }).click();
  await page.waitForTimeout(11000);

  // ① El Redirect murió: no aterriza en /ventas.
  const url = page.url();
  di(`① aterrizaje: ${url}`);
  if (/\/ventas\b/.test(url)) {
    fallos.push(`① aterrizó en /ventas — el Redirect sigue vivo (url=${url})`);
  }

  // ② Las cinco, por nombre accesible.
  const presentes = [];
  for (const t of CINCO) {
    const n = await page.getByRole('tab', { name: t, exact: true }).count();
    if (n > 0) presentes.push(t);
  }
  di(`② tabs por nombre: [${presentes.join(' · ')}]`);
  const faltan = CINCO.filter((t) => !presentes.includes(t));
  if (faltan.length > 0) fallos.push(`② faltan tabs: ${faltan.join(', ')}`);

  // ③ La ruta /ventas sigue viva — se navega a mano y tiene que responder
  //    su propia pantalla, no un 404 ni el fallback del router.
  await page.goto(`${BASE}/ventas`, { waitUntil: 'networkidle', timeout: 180000 });
  await page.waitForTimeout(6000);
  const texto = await page.locator('body').innerText();
  const viva = /pedido/i.test(texto) || /Stock/i.test(texto) || /Configuraci/i.test(texto);
  di(`③ /ventas responde: ${viva ? 'sí' : 'NO'}`);
  if (!viva) {
    fallos.push('③ /ventas no respondió — la ruta del empleado-vendedor (§0bis) se rompió');
  }
} catch (e) {
  fallos.push(`EXCEPCIÓN: ${e instanceof Error ? e.message : String(e)}`);
} finally {
  await browser.close();
}

if (fallos.length > 0) {
  console.error(`\n🔴 ROJO — ${fallos.length} fallo(s):`);
  for (const f of fallos) console.error(`   · ${f}`);
  process.exit(1);
}
console.log('\n✅ VERDE — el vendedor puro entra a la casa, con sus cinco cuartos, y /ventas sigue viva.');
