/**
 * S115-E · INSTRUMENTO 26 — EL CANÓNICO DECLARA CON QUÉ VERSIÓN DE ESQUEMA EMITE.
 *
 * 🔴 HAY DOS VERSIONES VIVAS EN PRODUCCIÓN, medidas sobre XML autorizados:
 *      SUSHICORP  → `<factura version="1.0.0">`
 *      CRECERMED  → `<factura version="2.1.0">`
 *    Y **no traen los mismos campos**: 2.1.0 agrega `agenteRetencion` en infoTributaria
 *    y `tarifa` dentro de totalImpuesto; 1.0.0 tiene `propina` y 2.1.0 **no**.
 *
 * POR QUÉ ES UN INSTRUMENTO Y NO UNA NOTA: **un cruce contra la versión equivocada da
 * faltantes que no faltan.** Mi propio `i25` reportó `propina` como hueco cruzando un
 * XML 1.0.0 contra un mapa fijo — y si mañana emitimos 2.1.0, `propina` sobra en vez de
 * faltar. *Es el mismo falso positivo de alcance que ya me cobré, en otro eje: medí
 * contra una vara que no era la del sujeto.*
 *
 * QUÉ EXIGE: que el canónico **diga** con qué versión emite, en vez de que la versión
 * viva escrita a mano en el generador del XML — donde nadie la ve y nadie la cambia.
 */
import { correr, rojo, noConcluyente } from './_lib-e.mjs';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import html from 'node:querystring';

const RAIZ = '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace';
const DIR_XML = `${RAIZ}/docs/relevamientos/xml-sri`;
const FACT = `${RAIZ}/supabase/functions/_shared/facturacion`;

const desescapar = (s) => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'").replace(/&amp;/g, '&');

await correr('i26 · el canónico declara su versión de esquema', async (r) => {
  // ── (a) LAS VERSIONES VIVAS, medidas de los XML reales ───────────────────
  if (!existsSync(DIR_XML)) noConcluyente(`no existe ${DIR_XML}`);
  const xmls = readdirSync(DIR_XML).filter((f) => f.endsWith('.xml'));
  if (!xmls.length) noConcluyente('no hay XML de referencia.');

  const versiones = new Map();
  for (const f of xmls) {
    const bruto = readFileSync(`${DIR_XML}/${f}`, 'utf8');
    const m = /<comprobante>([\s\S]*?)<\/comprobante>/.exec(bruto);
    const comp = m ? desescapar(m[1]) : bruto;
    const v = (/<(?:factura|notaCredito)[^>]*version="([^"]+)"/.exec(comp) ?? [])[1] ?? '(sin versión)';
    const campos = new Set([...comp.matchAll(/<(\w+)>[^<>]+<\/\1>/g)].map((x) => x[1]));
    versiones.set(v, { archivo: f, campos });
    r.dato(`${f}`, `version ${v} · ${campos.size} campos`);
  }

  // ── (b) 🔴 LA DIFERENCIA ENTRE VERSIONES, medida y no supuesta ───────────
  if (versiones.size >= 2) {
    const [[v1, a], [v2, b]] = [...versiones.entries()];
    const soloEn1 = [...a.campos].filter((c) => !b.campos.has(c));
    const soloEn2 = [...b.campos].filter((c) => !a.campos.has(c));
    r.di('');
    r.dato(`sólo en ${v1}`, soloEn1.join(', ') || '(ninguno)');
    r.dato(`sólo en ${v2}`, soloEn2.join(', ') || '(ninguno)');
    r.di('      ⇒ cruzar un documento contra el mapa de la OTRA versión inventa faltantes.');
  } else {
    r.di('\n   ⚠️ un solo XML de referencia: la diferencia entre versiones NO queda medida.');
  }

  // ── (c) ¿EL CANÓNICO DECLARA SU VERSIÓN DE ESQUEMA? ─────────────────────
  const canon = readFileSync(`${FACT}/canonico.ts`, 'utf8');
  const declara = /version_esquema|versionEsquema|esquema_sri|VERSION_ESQUEMA/.test(canon);
  r.di('');
  r.dato('CANONICO_VERSION (la nuestra)', (canon.match(/CANONICO_VERSION\s*=\s*(\d+)/) ?? [])[1] ?? '?');
  r.dato('declara versión de ESQUEMA del SRI', declara ? 'sí ✓' : '🔴 NO');

  // ── (d) ¿DÓNDE VIVE HOY LA VERSIÓN QUE SE EMITE? ────────────────────────
  const enGenerador = [];
  for (const f of readdirSync(FACT).filter((x) => x.endsWith('.ts'))) {
    const t = readFileSync(`${FACT}/${f}`, 'utf8');
    for (const m of t.matchAll(/version="(\d+\.\d+\.\d+)"/g))
      enGenerador.push({ archivo: f, version: m[1] });
  }
  r.dato('versión escrita a mano en el generador', enGenerador.length
    ? `🔴 ${enGenerador.map((x) => `${x.archivo}:${x.version}`).join(', ')}` : '0');

  if (!declara && enGenerador.length)
    rojo(`la versión del esquema vive ESCRITA A MANO en ${enGenerador.map((x) => x.archivo).join(', ')} y el canónico no la declara.\n` +
         `   Hay DOS versiones vivas en producción (${[...versiones.keys()].join(' y ')}) con campos distintos.\n` +
         `   Un documento armado contra la versión equivocada no falla acá: lo rechaza el SRI — y el cruce que\n` +
         `   debería avisarlo estaría comparando contra el mapa de la otra versión, inventando faltantes.`);
  if (!declara)
    rojo('el canónico no declara con qué versión de esquema emite: el cruce no tiene contra qué correr.');

  r.di('\n   → el canónico dice su versión, y el cruce corre contra ésa.');
});
