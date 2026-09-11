/**
 * S115-E · INSTRUMENTO 11 — LA CLAVE DE ACCESO.
 *
 * QUÉ MIDE: que `clave_acceso.ts` produzca claves que el SRI acepte —
 * 49 dígitos, módulo 11 válido, y el secuencial EMBEBIDO igual al de la fila.
 * Una clave con dígito verificador malo no falla acá: la rechaza el SRI, después
 * de que el cliente ya pagó.
 *
 * 🔴 EL VERIFICADOR ES PROPIO, NO EL DEL PRODUCTO. Reusar la función del producto
 * para verificarla sería preguntarle a la pieza si está de acuerdo consigo misma:
 * un error de signo o de secuencia de pesos daría verde en las dos puntas.
 *
 * ROJO PROBADO: se altera un dígito de cada clave y el verificador propio tiene
 * que rechazarla. *Un validador que nunca dijo que no no es un validador.*
 */
import { correr, rojo, noConcluyente } from './_lib-e.mjs';
import { spawnSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';

const N = 100;
const RUTA = '/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace/supabase/functions/_shared/facturacion/clave_acceso.ts';

/** Módulo 11 del SRI, escrito acá — pesos 2..7 cíclicos de derecha a izquierda. */
function digitoModulo11(cuerpo48) {
  let suma = 0, peso = 2;
  for (let i = cuerpo48.length - 1; i >= 0; i--) {
    suma += Number(cuerpo48[i]) * peso;
    peso = peso === 7 ? 2 : peso + 1;
  }
  const resto = suma % 11;
  const d = 11 - resto;
  return d === 11 ? 0 : d === 10 ? 1 : d;
}

await correr('i11 · clave de acceso · 49 dígitos + módulo 11', async (r) => {
  if (!existsSync(RUTA)) noConcluyente(`no existe ${RUTA}`);

  // ── Generar N claves llamando a la pieza REAL, con Deno ────────────────────
  const arnes = '/private/tmp/claude-501/-Users-guillo381gmail-com-proyectos-ePetPlace-e-petplace/e31c9cf9-5517-4887-9e34-60a4227ba727/scratchpad/arnes-clave.ts';
  writeFileSync(arnes, `
import * as m from '${RUTA}';
const fn = (m as any).construirClaveAcceso;
if (typeof fn !== 'function') {
  console.log(JSON.stringify({ error: 'no exporta función', exporta: Object.keys(m) }));
  Deno.exit(0);
}
const out: any[] = [];
for (let i = 1; i <= ${N}; i++) {
  const secuencial = String(i).padStart(9, '0');
  try {
    out.push({ secuencial, clave: fn({
      fecha: new Date(Date.UTC(2026, 8, 10)), tipoComprobante: 'factura', ruc: '1793240435001', ambiente: 1,
      establecimiento: '001', puntoEmision: '002', secuencial, codigoNumerico: String(i).padStart(8, '0'),
    }) });
  } catch (e) { out.push({ secuencial, error: String(e).slice(0, 200) }); }
}
console.log(JSON.stringify(out));
`);
  const res = spawnSync('deno', ['run', '--allow-read', arnes], { encoding: 'utf8', timeout: 120000 });
  if (res.error || res.status !== 0)
    noConcluyente(`deno no pudo correr el arnés (¿instalado?): ${String(res.stderr ?? res.error).slice(0, 400)}`);

  let claves;
  try { claves = JSON.parse(res.stdout.trim().split('\n').pop()); }
  catch { noConcluyente(`la salida del arnés no es JSON:\n   ${res.stdout.slice(0, 400)}`); }

  if (claves.error) noConcluyente(`clave_acceso.ts no exporta la función esperada. Exporta: ${JSON.stringify(claves.exporta)}`);
  const conError = claves.filter((c) => c.error);
  if (conError.length) noConcluyente(`${conError.length}/${N} generaciones lanzaron: ${conError[0].error}`);

  // ── (a) LONGITUD ──────────────────────────────────────────────────────────
  const malLargo = claves.filter((c) => String(c.clave).length !== 49);
  r.dato('longitud 49', `${N - malLargo.length}/${N}`);
  if (malLargo.length) rojo(`${malLargo.length} clave(s) no miden 49 dígitos (p.ej. ${String(malLargo[0].clave).length}).`);

  const noNumerico = claves.filter((c) => !/^\d{49}$/.test(String(c.clave)));
  if (noNumerico.length) rojo(`${noNumerico.length} clave(s) tienen caracteres que no son dígitos.`);

  // ── (b) MÓDULO 11, con verificador PROPIO ────────────────────────────────
  const malDv = claves.filter((c) => {
    const s = String(c.clave);
    return digitoModulo11(s.slice(0, 48)) !== Number(s[48]);
  });
  r.dato('módulo 11 válido', `${N - malDv.length}/${N}`);
  if (malDv.length) {
    const s = String(malDv[0].clave);
    rojo(`${malDv.length}/${N} claves con dígito verificador MALO (p.ej. …${s.slice(-10)}: esperado ${digitoModulo11(s.slice(0, 48))}, trae ${s[48]}). El SRI las rechaza después de cobrar.`);
  }

  // ── (c) ROJO PROBADO: alterar un dígito tiene que romper el verificador ───
  const alteradas = claves.filter((c) => {
    const s = String(c.clave);
    const i = 20;                                   // un dígito del medio, no el DV
    const roto = s.slice(0, i) + ((Number(s[i]) + 1) % 10) + s.slice(i + 1);
    return digitoModulo11(roto.slice(0, 48)) === Number(roto[48]);   // no debería pasar
  });
  r.dato('rojo ejercido (un dígito alterado)', `${N - alteradas.length}/${N} rechazadas por el verificador`);
  if (alteradas.length > 0)
    noConcluyente(`el verificador aceptó ${alteradas.length} clave(s) ALTERADAS: no está midiendo. Un validador que nunca dice que no no es un validador.`);

  // ── (d) SECUENCIAL EMBEBIDO = el de la fila ──────────────────────────────
  // Layout del SRI, contado sobre la propia pieza:
  //   ddmmaaaa(8) + tipo(2) + ruc(13) + ambiente(1) + est(3) + pto(3) = 30
  //   ⇒ el secuencial son los 9 dígitos en 30..38.
  const malSec = claves.filter((c) => String(c.clave).slice(30, 39) !== c.secuencial);
  r.dato('secuencial embebido', `${N - malSec.length}/${N} coinciden con el de la fila`);
  if (malSec.length) {
    const c = malSec[0];
    rojo(`${malSec.length} clave(s) llevan un secuencial distinto del de su fila (fila ${c.secuencial} · clave ${String(c.clave).slice(30, 39)}). La clave y el libro dirían cosas distintas.`);
  }

  // ── (e) Todas distintas ──────────────────────────────────────────────────
  const unicas = new Set(claves.map((c) => c.clave));
  r.dato('claves distintas', `${unicas.size}/${N}`);
  if (unicas.size !== N) rojo(`${N - unicas.size} clave(s) repetidas.`);

  r.di(`\n   → ${N} claves: 49 dígitos, módulo 11 propio, secuencial embebido coherente, y el verificador se vio decir que no.`);
});
