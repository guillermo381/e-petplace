/**
 * D-1021 · BRUMA — una mascota en memoria no se trata como viva.
 *
 * Sesión REAL con la cuenta demo (fixture de E). Se mide **qué le PIDE** cada
 * pantalla: los verbos son el síntoma —«registrar», «cargar», «resolver»— y
 * la presencia con Coach es el peor, porque sus cuatro atajos actúan.
 */
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
const env = Object.fromEntries(
  readFileSync('apps/cliente/.env.local', 'utf8').split('\n').filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
const QUIEN = process.env.MASCOTA ?? 'Bruma';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await (await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } })).newPage();
const errores = [];
page.on('pageerror', (e) => errores.push(`${e.name}: ${e.message}`));
const T = async () => await page.evaluate(() => document.body.innerText).catch(() => '');
const di = (s) => console.log(s);
const botones = async () =>
  await page.evaluate(() => [...document.querySelectorAll('[role="button"]')].map((e) => (e.getAttribute('aria-label') ?? '').trim()).filter(Boolean));

await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 240000 });
for (let i = 0; i < 60 && !(await T()).includes('Contraseña'); i++) await page.waitForTimeout(1000);
/* 🔴 **LA CUENTA SE DECLARA, y esto lo pario un error mio.** `.env.local`
   trae `demo-prestador@epetplace.dev`, que es OTRA familia — la de Zeus y
   Kira— y con ella reporte «no pude medir a Bruma» como si la fixture no
   existiera. *El saludo de la pantalla decia «Buenas tardes, demo-prestador»
   en cada corrida y no lo lei.* La familia de Bruma es `ce057f90`, de
   `guillo381+8@gmail.com` (medido por E). Se puede sobreescribir por entorno;
   la clave sale del keychain y nunca del codigo. */
const CORREO = process.env.CLIENTE_EMAIL ?? env.EXPO_PUBLIC_DEMO_EMAIL;
const CLAVE = process.env.CLIENTE_PASSWORD ?? env.EXPO_PUBLIC_DEMO_PASSWORD;
di(`cuenta: ${CORREO}`);
await page.getByRole('textbox', { name: 'Email' }).fill(CORREO);
await page.getByRole('textbox', { name: 'Contraseña' }).fill(CLAVE);
await page.getByText('Entrar', { exact: true }).click();
await page.waitForTimeout(16000);

di(`── EL HOGAR ───────────────────────────────────────────────`);
const tH = await T();
/* 🔴 **EL GLOBO DE LA TIRA (`D-1026`)** — se mide en el HOGAR, antes de entrar
   a la ficha: la tira es donde el founder lo vio. Se lee del texto de la
   tarjeta de cada una, no del documento entero, para no atribuirle a Bruma un
   «1 por resolver» que es de Zeus. */
const globos = await page.evaluate(() => {
  const nombres = ['Zeus', 'Kira', 'Bruma', 'Thor', 'Sombra'];
  const sal = [];
  for (const e of document.querySelectorAll('[role="button"], [role="link"]')) {
    const txt = (e.textContent ?? '').trim();
    const quien = nombres.find((n) => new RegExp(`(^|\\W)${n}(\\W|$)`).test(txt));
    if (quien !== undefined && /por resolver/i.test(txt)) sal.push(`${quien}: ${(txt.match(/\d+ por resolver/) ?? ['?'])[0]}`);
  }
  return [...new Set(sal)];
});
di(`globos «por resolver» en la tira: ${globos.join(' · ') || 'ninguno'}`);
di(`🔴 alguna en memoria con globo: ${globos.some((g) => /^(Bruma|Sombra):/.test(g)) ? 'SÍ' : 'no ✓'}`);

di(`mascotas a la vista: ${['Zeus', 'Kira', 'Bruma', 'Thor', 'Sombra'].filter((n) => tH.includes(n)).join(' · ')}`);
const chip = page.getByRole('button', { name: QUIEN, exact: true });
if ((await chip.count()) === 0) {
  di(`🔴 No encuentro a ${QUIEN} — no pude medir.`);
  di(tH.split('\n').filter((x) => x.trim()).slice(0, 10).join(' · '));
di(`captura: docs/loop/S113-C-${QUIEN}.png`);
await browser.close(); process.exit(2);
}

di(`\n── LA FICHA DE ${QUIEN} ───────────────────────────────────`);
await chip.first().click();
await page.waitForTimeout(7000);
const t = await T();
const b = await botones();
const PIDEN = ['Registrar', 'registrar', 'Cargar', 'cargar el carnet', 'Agendar', 'Reservar', 'Anotar', 'Actualizar', 'Declarar'];
di(`ruta: ${page.url().replace('http://localhost:8082','')}`);
di(`verbos que le PIDEN algo: ${[...new Set(PIDEN.filter((v) => t.includes(v)))].join(' · ') || 'NINGUNO ✓'}`);
di(`botones que le piden: ${b.filter((n) => PIDEN.some((v) => n.includes(v))).join(' · ') || 'ninguno ✓'}`);
/* 🔴 **EL DISCRIMINADOR NO ES LA ETIQUETA DEL DISCO.** La primera version
   leia «Abrir a Nexo» como «hay Coach» — y las DOS variantes compartian esa
   voz, asi que reporto un rojo falso sobre una cura que funcionaba. Lo que
   distingue una presencia con Coach de una sin el son **los dedos y la fila
   «Preguntale»**: eso es lo que el contrato de B hace imposible con
   `coach: false`. La etiqueta se sigue imprimiendo, pero como HECHO aparte. */
di(`voz del disco (dato, no veredicto): ${b.filter((n) => /^Abrir a |Lo que te espera/i.test(n)).join(' · ') || 'ninguna'}`);
di(`🔴 nombra al Coach en su voz: ${b.some((n) => /Nexo/i.test(n)) ? 'SI' : 'no ✓'}`);
const dedos = b.filter((n) => /^(Peso|Vacuna|Antiparasitario|Foto)$/.test(n));
/* 🔴 **LOS DEDOS SÓLO EXISTEN CON LA PATA ABIERTA**, asi que en reposo su
   ausencia no prueba nada — con Zeus, que SI lleva Coach, el arnes tambien
   decia «sin dedos». *Una ausencia que se da igual en los dos casos no es un
   discriminador.* Se TOCA el disco y se vuelve a mirar. */
const disco = page.getByRole('button', { name: /^Abrir a |^Lo que te espera$/ }).first();
if (await disco.count() > 0) {
  await disco.click().catch(() => {});
  await page.waitForTimeout(1500);
}
const b2 = await page.evaluate(() => [...document.querySelectorAll('[role="button"]')].map((e) => (e.getAttribute('aria-label') ?? e.textContent ?? '').trim()));
/* 🔴 **LOS ROTULOS SE LEEN DEL DICCIONARIO, no de mi memoria.** Estaban
   tecleados y el dia que el cuarto dedo paso de «Foto» a «Recuerdo» el arnes
   reporto TRES dedos — *un instrumento atado a un literal envejece con la voz
   y su rojo culpa a la app.* */
const ROTULOS = [...readFileSync('apps/cliente/src/i18n/es.ts', 'utf8').matchAll(/\bdedo\w+: '([^']+)'/g)].map((m) => m[1]);
const dedosAbierta = b2.filter((n) => ROTULOS.includes(n));
di(`— con la pata ABIERTA —`);
di(`  dedos: ${dedosAbierta.join(' · ') || 'ninguno'}`);
di(`  «Preguntale»: ${b2.some((n) => /^Preguntale/i.test(n)) ? 'sí' : 'no'}`);
di(`  ⇒ presencia CON Coach: ${dedosAbierta.length > 0 || b2.some((n) => /^Preguntale/i.test(n)) ? 'SÍ' : 'NO'}`);
di(`botones que nombran a ${QUIEN}: ${b.filter((n) => n.includes(QUIEN)).join(' · ') || 'ninguno ✓'}`);
di(`dedos a la vista: ${dedos.join(' · ') || 'ninguno ✓'}`);
di(`«por resolver» / pendientes: ${/por resolver|Ponte al día/i.test(t) ? 'SÍ 🔴' : 'no ✓'}`);
di(`\nerrores de página: ${errores.length}${errores.length ? ' — ' + errores[0] : ''}`);
await page.screenshot({ path: `docs/loop/S113-C-${QUIEN}.png` });
di(`captura: docs/loop/S113-C-${QUIEN}.png`);
await browser.close();
