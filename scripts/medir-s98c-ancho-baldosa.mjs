/**
 * medir-s98c-ancho-baldosa.mjs — ¿CUÁNTO ENTRA EN EL DETALLE DE UNA BALDOSA?
 *
 * No es una captura: es una MEDICIÓN. `Baldosa` pinta su detalle con
 * `numberOfLines={1}`, así que toda voz que no entre se corta con «…» —
 * y un subtítulo truncado no informa, encima se ve roto.
 *
 * Hasta ahora yo venía estimando el ancho útil «a ~6,5 px por carácter».
 * Eso es adivinar con decimales. Acá se lee del objeto: el ancho REAL del
 * nodo y la fuente REAL computada, y con eso se miden las candidatas.
 *
 * Salida: por cada candidata, px medidos y VEREDICTO contra el ancho útil.
 */
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';

const env = readFileSync(new URL('../apps/prestador/.env.local', import.meta.url).pathname, 'utf8');
const leer = (k) => (env.match(new RegExp(`^${k}=(.*)$`, 'm')) ?? [])[1]?.trim() ?? '';
const EMAIL = process.env.CUENTA || leer('EXPO_PUBLIC_DEMO_EMAIL');
const PASS = process.env.CLAVE || leer('EXPO_PUBLIC_DEMO_PASSWORD');

// Las candidatas: la forma LITERAL de la firma y las variantes cortas.
const CANDIDATAS = [
  // — la forma LITERAL de la firma, para dejar su medición en el registro —
  'Sin citas de grooming hoy',
  'Sin citas de adiestramiento hoy',
  'Sin citas de vet hoy',
  // — el sustantivo del OFICIO en plural (la forma del propio ejemplo del
  //   founder: «no tienes PASEOS programados») —
  'Sin paseos hoy',
  '12 paseos hoy',
  'Sin sesiones hoy',
  '12 sesiones hoy',
  'Sin consultas hoy',
  '12 consultas hoy',
  'Sin baños hoy',
  'Sin citas de estética hoy',
  'Sin estéticas hoy',
  '12 citas de estética hoy',
  // — el apellido ADELANTE —
  'Estética: sin citas hoy',
  'Adiestramiento: sin citas hoy',
  'Veterinaria: sin citas hoy',
  // — el peor caso de cada forma corta (dos dígitos) —
  '12 baños hoy',
  // — el nudo: grooming, el único sin sustantivo propio que entre —
  'Sin citas estéticas hoy',
  'Sin citas de estética',
  '12 citas de vet hoy',
  'Sin citas de aseo hoy',
  '12 citas de aseo hoy',
];

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ locale: 'es-EC', viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();

await page.goto('http://localhost:8081/login', { waitUntil: 'networkidle', timeout: 180000 });
await page.getByPlaceholder('ej: ana@correo.com').fill(EMAIL);
await page.locator('input[type="password"]').fill(PASS);
await page.getByText('Entrar', { exact: true }).click();
await page.waitForTimeout(9000);
await page.goto('http://localhost:8081/atender', { waitUntil: 'networkidle', timeout: 180000 });
await page.waitForTimeout(6000);

const nodo = page.getByText('Sin agenda hoy').first();
if ((await nodo.count()) === 0) {
  console.error('✗ ABORTA: no encontré el detalle de la baldosa — ¿abrió la sesión?');
  await browser.close();
  process.exit(1);
}

const medida = await nodo.evaluate((el, candidatas) => {
  const cs = getComputedStyle(el);
  const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} / ${cs.lineHeight} ${cs.fontFamily}`;
  const canvas = document.createElement('canvas');
  const ctx2d = canvas.getContext('2d');
  ctx2d.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  // El ancho ÚTIL es el del nodo de texto ya resuelto por el layout real —
  // no una resta a mano de paddings, que es donde yo venía equivocándome.
  const util = el.getBoundingClientRect().width;
  return {
    font,
    fontSize: cs.fontSize,
    util,
    anchos: candidatas.map((c) => ({ texto: c, px: ctx2d.measureText(c).width })),
  };
}, CANDIDATAS);

console.log(`\nfuente computada : ${medida.font}`);
console.log(`ancho ÚTIL medido: ${medida.util.toFixed(1)} px  (viewport 420)\n`);
console.log('candidata                                px      veredicto');
console.log('─'.repeat(66));
for (const a of medida.anchos) {
  const entra = a.px <= medida.util;
  console.log(
    `${a.texto.padEnd(38)} ${a.px.toFixed(1).padStart(6)}   ${entra ? '✓ entra' : '✗ TRUNCA'}`,
  );
}
console.log(
  `\n⚠️ Medido en viewport 420. Un Android de 412 da la celda más angosta:` +
    ` el margen de seguridad se toma sobre ${(medida.util * (380 / 388)).toFixed(1)} px.`,
);

await browser.close();
