#!/usr/bin/env node
/**
 * medir-chips-canal — ¿ENTRAN TRES CHIPS DE CANAL EN UN TELÉFONO?
 * (S87-B, insumo de la lámina de PREFERENCIAS — D-651 aparte.)
 *
 * ┌───────────────────────────────────────────────────────────────────┐
 * │ ARITMÉTICA DE PROPS CONTRA PÍXELES.                               │
 * └───────────────────────────────────────────────────────────────────┘
 *
 * La geometría sale del OBJETO (`SelectorOpcion.tsx` + tokens) y el ancho
 * del texto se mide con LA FUENTE REAL (`DMSans_500Medium.ttf` de
 * `@expo-google-fonts`), no con una estimación de caracteres.
 *
 * POR QUÉ VIVE EN EL REPO Y NO EN UN SCRATCH (adjudicación de mesa, S87):
 * **los bordes son de 6 y 5 píxeles**, y este instrumento se vuelve a
 * necesitar cada vez que una etiqueta cambie. Y van a cambiar: las keys
 * de voz de los canales **todavía no nacen** — lo que se midió acá son
 * CANDIDATAS declaradas como tales.
 *
 * ⚠️ SU PROPIO DISCRIMINADOR, Y NO ES DECORATIVO — SE COBRÓ EN LA PRIMERA
 *    CORRIDA. Sin `document.fonts.check()`, el canvas cae al fallback del
 *    sistema y devuelve números **creíbles y falsos**: «WhatsApp» midió
 *    **56px** con el fallback y **65px** con DM Sans cargada. Nada falla,
 *    nada avisa, y la tabla que sale de ahí se cita después como medición.
 *    Se cazó porque el MISMO string dio dos anchos distintos entre juegos.
 *    **Si la fuente no carga, este script sale en ROJO y no mide** (L-197:
 *    un fallo degrada a ausencia, jamás a un valor que alguien use como
 *    cierto).
 *
 * ⚠️ EL LÍMITE, declarado acá y no solo en el acta: esto es **canvas en
 *    Chrome con la fuente real**, NO un render de React Native en un
 *    aparato. El shaping de RN puede diferir en algún píxel ⇒ **todo
 *    resultado con holgura de un dígito hay que verlo en pantalla** antes
 *    de apoyar una decisión en él (L-143).
 *
 * Exige Chrome instalado (mismo canal que `verify-gallery.mjs`).
 * El exit se lee del COMANDO, jamás del pipe (L-191).
 *
 *   node scripts/medir-chips-canal.mjs
 */

import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';

const TTF = new URL('../node_modules/@expo-google-fonts/dm-sans/500Medium/DMSans_500Medium.ttf', import.meta.url);

/** LA GEOMETRÍA — leída del objeto, con su fuente al lado. Si alguno de
 *  estos números cambia en `packages/ui`, cambia acá y se vuelve a correr:
 *  un instrumento con la geometría vieja es el árbol viejo de S84. */
const G = {
  fuente: 13,            // typography.size.sm
  chipPadX: 16 * 2,      // SelectorOpcion: paddingHorizontal spacing[4]
  gap: 8,                // SelectorOpcion: gap spacing[2] entre chips
  pantallaPadX: 20 * 2,  // cuenta/preferencias.tsx: padding spacing[5]
  tarjetaPadX: 12 * 2,   // Tarjeta relleno 'normal' = spacing[3]
};

/** LOS ANCHOS, en dp, CADA UNO CON SU NOMBRE — un ancho sin nombre no se
 *  puede discutir («¿de dónde salió 393?»). */
const ANCHOS = [
  { w: 320, que: 'piso histórico de Android (iPhone SE 1ª gen)' },
  { w: 360, que: 'el ancho más común de Android' },
  { w: 375, que: 'iPhone SE 2/3 · iPhone 13 mini' },
  { w: 393, que: 'Pixel 8/9 · iPhone 15/16' },
  { w: 412, que: 'Samsung Galaxy S-series (el aparato del founder es Samsung)' },
  { w: 448, que: 'emulator-5554, MEDIDO con adb (1344 px ÷ density 480)' },
];

/** ⚠️ CANDIDATAS, NO FIRMADAS. Las keys de voz de los canales no existen
 *  todavía (medido S87: cero en los diccionarios de las dos apps). Cuando
 *  nazcan, ESTAS LÍNEAS SE REEMPLAZAN por las reales y se vuelve a correr
 *  — que es exactamente para lo que este archivo está en el repo. */
const JUEGOS = [
  { id: 'es · corto',     labels: ['Push', 'Correo', 'WhatsApp'] },
  { id: 'en · corto',     labels: ['Push', 'Email', 'WhatsApp'] },
  { id: 'es · explícito', labels: ['Notificación', 'Correo', 'WhatsApp'] },
  { id: 'en · explícito', labels: ['Notification', 'Email', 'WhatsApp'] },
];

/** LAS ESCALAS DEL SO — el eje que convirtió «¿entran?» en otra pregunta.
 *  Medido S87: `allowFontScaling` NO está apagado en `SelectorOpcion`, y
 *  no existe `maxFontSizeMultiplier` en el repo ⇒ el texto crece con el
 *  ajuste del sistema y el padding NO. */
const ESCALAS = [
  { s: 1.0,  que: 'default' },
  { s: 1.15, que: 'Android «Grande»' },
  { s: 1.30, que: 'Android «El más grande» (tope del ajuste normal)' },
  { s: 1.50, que: 'Samsung / accesibilidad' },
  { s: 2.0,  que: 'iOS Dynamic Type accesibilidad' },
];

const ttf = readFileSync(TTF).toString('base64');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
await page.addStyleTag({
  content: `@font-face{font-family:'DMSansM';src:url(data:font/ttf;base64,${ttf}) format('truetype');font-weight:500;}`,
});
// ── EL DISCRIMINADOR (su porqué, arriba). Va ANTES de medir: un rojo
//    después de imprimir la tabla llega tarde — alguien ya la copió.
//
//    Y LOS DOS MODOS DE FALLA VAN AL MISMO ROJO HABLADO, que es la parte
//    que hubo que corregir al depositarlo: con el payload corrupto,
//    `fonts.load()` LANZA y el script moría con un stack trace de
//    Playwright. El exit era correcto (1) y el mensaje no decía nada —
//    y **el mensaje de un guard es parte del guard**. Sin esto, el
//    siguiente que lo corra lee «NetworkError» y va a buscar el problema
//    en su red, no en la fuente.
let fuenteOk = false;
try {
  await page.evaluate(async () => {
    await document.fonts.load('500 13px DMSansM');
    await document.fonts.ready;
  });
  fuenteOk = await page.evaluate(() => document.fonts.check('500 13px DMSansM'));
} catch {
  fuenteOk = false; // el @font-face no se pudo resolver (payload/ruta rota)
}
if (!fuenteOk) {
  console.error('✗ LA FUENTE NO CARGÓ — no se mide nada.');
  console.error('  Sin DM Sans, el canvas usa el fallback del sistema y devuelve');
  console.error('  números creíbles y falsos («WhatsApp» 56px en vez de 65px).');
  console.error('  Por L-197 esto es ROJO: no hay medición que degradar a estimación.');
  console.error(`  Revisá que exista el .ttf: ${TTF.pathname}`);
  await browser.close();
  process.exit(1);
}

const medir = (labels, px) =>
  page.evaluate(
    ([ls, size]) => {
      const c = document.createElement('canvas').getContext('2d');
      c.font = `500 ${size}px DMSansM`;
      return ls.map((l) => Math.ceil(c.measureText(l).width));
    },
    [labels, px],
  );

const requerido = (anchos) => anchos.reduce((a, b) => a + b, 0) + 3 * G.chipPadX + 2 * G.gap;
const disponible = (w) => w - G.pantallaPadX - G.tarjetaPadX;

console.log(
  `geometría (del objeto) · fuente ${G.fuente}px DMSans_500Medium · chip padX ${G.chipPadX} · ` +
    `gap ${G.gap} · pantalla padX ${G.pantallaPadX} · Tarjeta padX ${G.tarjetaPadX}`,
);
console.log(
  `fórmula · disponible = ancho − ${G.pantallaPadX + G.tarjetaPadX}   ·   ` +
    `requerido = Σtexto + 3×${G.chipPadX} + 2×${G.gap} = Σtexto + ${3 * G.chipPadX + 2 * G.gap}\n`,
);

console.log('══ ① A ESCALA POR DEFAULT ─────────────────────────────────────────');
for (const j of JUEGOS) {
  const anchos = await medir(j.labels, G.fuente);
  const req = requerido(anchos);
  console.log(
    `\n── ${j.id}: ${j.labels.map((l, i) => `«${l}» ${anchos[i]}px`).join(' · ')}  ⇒ requerido ${req}px`,
  );
  for (const a of ANCHOS) {
    const h = disponible(a.w) - req;
    console.log(
      `     ${String(a.w).padStart(3)}dp  disponible ${String(disponible(a.w)).padStart(3)}px  ` +
        `holgura ${String(h).padStart(4)}px  ${h >= 0 ? '✓ ENTERO' : '✗ TRUNCA'}   (${a.que})`,
    );
  }
}

console.log('\n══ ② CONTRA LA ESCALA DE FUENTE DEL SO ─────────────────────────────');
console.log('   (crece el TEXTO; el padding y el gap NO — por eso la holgura cae más rápido');
console.log('    de lo que parece. `allowFontScaling` no está apagado en SelectorOpcion.)');
for (const j of JUEGOS.slice(0, 2)) {
  console.log(`\n── ${j.id}`);
  for (const e of ESCALAS) {
    const px = G.fuente * e.s;
    const req = requerido(await medir(j.labels, px));
    const fila = ANCHOS.filter((a) => a.w <= 412)
      .map((a) => { const h = disponible(a.w) - req; return `${a.w}dp ${h >= 0 ? '✓' : '✗'}${String(h).padStart(5)}px`; })
      .join('  ');
    console.log(`   ×${e.s.toFixed(2)} (${String(Math.round(px * 10) / 10).padStart(4)}px)  req ${String(req).padStart(3)}px   ${fila}   ${e.que}`);
  }
}

console.log('\n⚠️  canvas en Chrome con la fuente real — NO es un render de React Native.');
console.log('    Toda holgura de un dígito cae dentro del margen de error: se ve en pantalla (L-143).');

await browser.close();
