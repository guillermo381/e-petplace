/**
 * ⭐ **¿CUÁNTO PESA EL CARNET QUE VIAJA?** (S113-C · lote 1.0 · C1).
 *
 * ── QUÉ MIDE, Y POR QUÉ NO ALCANZA CON LEER EL CÓDIGO ───────────────────────
 * `carnet.tsx` ya pide `capturarVia({ redimensionarA: LADO_CARNET })` con
 * `LADO_CARNET = 1600` — o sea que **C1 estaba cumplido en `main` antes de este
 * lote**. Pero *que el código lo pida no prueba que la imagen viaje achicada*:
 * la herramienta puede fallar en silencio, la web puede tomar otro camino que
 * el nativo, o el redimensionado puede correr DESPUÉS de que el base64 ya se
 * armó. Lo único que lo prueba es **contar los bytes que salen**.
 *
 * Por eso el arnés no mira el archivo: intercepta **la petición a la edge** y
 * mide el `imageBase64` que de verdad se manda.
 *
 * ⚠️ **Corre en WEB**, y ahí el redimensionado lo hace un canvas; en el aparato
 * lo hace el módulo nativo. Son dos implementaciones de la misma llamada, así
 * que este número acota pero **no reemplaza la medición en dispositivo** — se
 * declara y no se disfraza.
 */
import { chromium } from 'playwright-core';
import { readFileSync, statSync } from 'node:fs';

const CARNET = process.env.CARNET ?? '';
const CORREO = process.env.CLIENTE_EMAIL ?? '';
const CLAVE = process.env.CLIENTE_PASSWORD ?? '';
const MASCOTA_ID = process.env.MASCOTA_ID ?? '';
const di = (s) => console.log(s);

const antes = statSync(CARNET).size;
di(`cuenta: ${CORREO}`);
di(`carnet de prueba: ${CARNET.split('/').pop()} · ${antes.toLocaleString('es')} bytes ANTES`);

const navegador = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
const page = await navegador.newPage({ viewport: { width: 420, height: 900 }, locale: 'es-EC' });
const errores = [];
page.on('pageerror', (e) => errores.push(String(e).slice(0, 160)));

/* La medición: el cuerpo que sale hacia la edge de extracción. */
let bytesQueViajan = null;
let largoBase64 = null;
page.on('request', (r) => {
  if (!/extract-vacuna/.test(r.url())) return;
  const cuerpo = r.postData();
  if (cuerpo === null) return;
  bytesQueViajan = Buffer.byteLength(cuerpo, 'utf8');
  try {
    const j = JSON.parse(cuerpo);
    if (typeof j.imageBase64 === 'string') largoBase64 = j.imageBase64.length;
  } catch {
    /* si no es JSON, queda el tamaño del cuerpo, que ya dice lo suyo */
  }
});

const T = async () => await page.evaluate(() => document.body.innerText).catch(() => '');

await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 240000 });
for (let i = 0; i < 200 && (await page.locator('input[type="password"]').count()) === 0; i += 1) {
  await page.waitForTimeout(1000);
}
await page.locator('input[type="email"]').fill(CORREO);
await page.locator('input[type="password"]').fill(CLAVE);
await page.getByText(/^(Entrar|Sign in)$/).first().click();
await page.waitForTimeout(14000);

await page.goto(`http://localhost:8082/carnet?mascotaId=${MASCOTA_ID}&nombre=Zeus`, { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForTimeout(6000);

/* La galería abre un input de archivo: se lo interceptamos y le damos el
   carnet de prueba. Es el mismo camino que usa una persona. */
/* 🔴 SON DOS TOQUES, no uno: «Más opciones» abre una Hoja y la galería vive
   adentro. La primera version le pegaba al primero y esperaba el selector de
   archivo que ese toque nunca abre. */
await page.getByText(/Más opciones|More options/i).first().click().catch(() => {});
await page.waitForTimeout(2500);
di(`la Hoja ofrece: ${(await page.evaluate(() => [...document.querySelectorAll('[role="button"]')].map((e) => (e.getAttribute('aria-label') ?? e.textContent ?? '').trim()).filter(Boolean))).slice(0, 8).join(' · ')}`);
const abrirGaleria = page.getByText(/galer|gallery|Elegir|Choose/i).first();
const [chooser] = await Promise.all([
  page.waitForEvent('filechooser', { timeout: 30000 }).catch(() => null),
  abrirGaleria.click().catch(() => {}),
]);
if (chooser === null) {
  di('🔴 no se abrió el selector de archivo — no pude medir por este camino.');
  di(`lo que muestra la pantalla: ${(await T()).split('\n').filter((x) => x.trim()).slice(0, 6).join(' | ')}`);
  await navegador.close();
  process.exit(2);
}
await chooser.setFiles(CARNET);

/* Se espera a que la petición salga (o a que la pantalla diga por qué no), y de
   paso se mira LA ESPERA: la primera voz y, pasados 8 s, la segunda (C2). Es la
   misma corrida porque es el mismo hecho — el carnet que tarda es justamente el
   que hace falta para ver el segundo mensaje. */
const vistos = new Set();
for (let i = 0; i < 60 && bytesQueViajan === null; i += 1) await page.waitForTimeout(1000);
for (let i = 0; i < 40; i += 1) {
  const t = await T();
  if (/Estamos leyendo el carnet/.test(t)) vistos.add(`+${i}s primera voz`);
  if (/Seguimos leyendo/.test(t)) { vistos.add(`+${i}s SEGUNDA voz (8 s)`); break; }
  if (/revisar|Guardar|Revisá/i.test(t) && vistos.size > 0) { vistos.add(`+${i}s la lectura termino antes de los 8 s`); break; }
  await page.waitForTimeout(1000);
}
di(`la espera dijo: ${[...vistos].join(' → ') || '(no la vi)'}`);

di('');
if (bytesQueViajan === null) {
  di('🔴 la petición a la edge nunca salió — no hay número que declarar.');
  di(`pantalla: ${(await T()).split('\n').filter((x) => x.trim()).slice(0, 8).join(' | ')}`);
} else {
  /* base64 pesa 4/3 de los bytes reales: se convierte para poder comparar
     manzanas con manzanas contra el archivo del disco. */
  const bytesImagen = largoBase64 === null ? null : Math.round((largoBase64 * 3) / 4);
  di(`cuerpo que viaja a la edge : ${bytesQueViajan.toLocaleString('es')} bytes`);
  if (bytesImagen !== null) {
    di(`la imagen adentro (base64→bytes): ${bytesImagen.toLocaleString('es')} bytes DESPUÉS`);
    di(`⇒ ${antes.toLocaleString('es')} → ${bytesImagen.toLocaleString('es')} · ${(bytesImagen / antes).toFixed(2)}× del original`);
  }
}
/* ── C3 · LA CONFIRMACIÓN FILA POR FILA ────────────────────────────────────
   🔴 **NO SE GUARDA.** Se mide hasta el botón habilitado y ahí se para: tocar
   «Guardar» escribiría eventos clínicos falsos —salidos de una captura de
   pantalla, no de un carnet— en una mascota REAL de la cuenta, y **no hay
   camino de borrado en el producto**. La mitad que falta (N confirmadas → N
   filas en la base) la corre quien pueda hacerlo sobre una mascota
   descartable. */
await page.waitForTimeout(6000);
const etiquetaGuardar = async () =>
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('[role="button"]')]
      .map((e) => (e.getAttribute('aria-label') ?? e.textContent ?? '').trim())
      .filter((x) => /Sumar|Guardar|Faltan|left to check|Save/i.test(x));
    return b[0] ?? '(no hay botón de guardar)';
  });
di('');
di('── C3 · la revisión ───────────────────────────────────────');
const filas = await page.evaluate(() =>
  [...document.querySelectorAll('[role="button"]')]
    .map((e) => (e.getAttribute('aria-label') ?? e.textContent ?? '').trim())
    .filter((x) => /^Es correcta$|^Looks right$/.test(x)).length,
);
di(`filas con «Es correcta»: ${filas}`);
di(`🔴 ROJO · el botón, sin tocar ninguna: «${await etiquetaGuardar()}»`);
/* 🔴 **`.nth(k)`, NO `.first()`.** La pieza deja el botón puesto después de
   confirmar —confirmar no lo hace desaparecer—, así que tocar «el primero»
   tres veces le pega tres veces a la MISMA fila: el contador bajaba de 3 a 2 y
   parecía que la app no registraba. *Es la cuarta vez en este arco que
   `.first()` fabrica un rojo falso.* */
for (let k = 0; k < filas; k += 1) {
  const b = page.getByRole('button', { name: /^(Es correcta|Looks right)$/ }).nth(k);
  if ((await b.count()) === 0) break;
  await b.click().catch(() => {});
  await page.waitForTimeout(700);
}
di(`✅ VERDE · tras confirmar las ${filas}: «${await etiquetaGuardar()}»`);
di(`sigue habiendo «Es correcta» sin tocar: ${await page.getByRole('button', { name: /^(Es correcta|Looks right)$/ }).count()}`);

di(`errores de página: ${errores.length}${errores.length ? ' — ' + errores[0] : ''}`);
await page.screenshot({ path: 'docs/loop/S113-C-carnet-bytes.png' });
await navegador.close();
