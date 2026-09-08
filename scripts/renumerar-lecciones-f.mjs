#!/usr/bin/env node
/**
 * RENUMERAR LAS LECCIONES DE F — con el mapa como PARÁMETRO.
 *
 * Nace en S114-F porque el mapa todavía no está firme (A lo confirma contra el
 * candidato ENSAMBLADO, no rama-vs-rama), y **el trabajo caro no es el número:
 * es saber cuál de cada 24 apariciones se toca**.
 *
 * 🔴 POR QUÉ NO ES UN `sed`, y está medido: en la renumeración anterior
 * (L-507→L-516) el número vivía en 13 lugares y **TRES no eran míos**. Acá, de
 * 24 apariciones, hay DOS clases que un reemplazo global rompería:
 *
 *   ① citas de lecciones de OTRA PISTA dentro de mis archivos
 *      (mi carta a A tabula el candidato: "L-500 gate publica cifras" es de B).
 *      Un sed global inventaría un número para una lección ajena.
 *
 *   ② afirmaciones que se vuelven FALSAS al renumerar
 *      ("mis L-503–L-506 son idénticas por md5"): eso fue verdad y verificado.
 *      Renumerar adentro la convierte en mentira — se MARCA como histórica.
 *
 * uso:  node renumerar-lecciones-f.mjs --mapa 500:518,501:519,502:520,503:521
 *       node renumerar-lecciones-f.mjs --mapa ... --seco     (no escribe)
 *       node renumerar-lecciones-f.mjs --control             (se prueba solo)
 */
import { readFileSync, writeFileSync } from 'node:fs';

/** Archivos donde MIS citas viven, y qué hacer con cada uno. */
export const TERRITORIO = [
  { archivo: 'docs/DEUDAS_CANONICAS.md',            trato: 'renumerar' },
  { archivo: 'docs/loop/S114-F-CIERRE-DEPLOY.md',    trato: 'renumerar' },
  { archivo: 'docs/loop/S114-F-TANDA1.md',           trato: 'renumerar' },
  // 🔴 NO se renumeran: son cartas ya entregadas que describen un estado pasado.
  { archivo: 'docs/loop/buzon/S114-F-para-A-confirmame-el-candidato-y-los-numeros.md',
    trato: 'historia', razon: 'tabula el candidato: sus L-500/L-501 son de B' },
  { archivo: 'docs/loop/buzon/S114-F-para-A-sha-vigente.md',
    trato: 'historia', razon: 'afirma un md5 verificado sobre los números viejos' },
];

/** Reemplaza L-NNN sólo cuando NNN está en el mapa. Un solo barrido: si se
 *  encadenaran (500→518 y luego 518→otro) se pisarían entre sí. */
export function renumerar(texto, mapa) {
  let tocados = 0;
  const salida = texto.replace(/L-(\d{3})/g, (todo, n) => {
    if (!(n in mapa)) return todo;
    tocados++;
    return `L-${mapa[n]}`;
  });
  return { salida, tocados };
}

/** Un mapa es válido si ningún destino es también origen: eso sería una cadena
 *  y el resultado dependería del orden — que es como se pierde un número. */
export function mapaSano(mapa) {
  const origenes = new Set(Object.keys(mapa));
  const choques = Object.values(mapa).map(String).filter((d) => origenes.has(d));
  return { sano: choques.length === 0, choques };
}

if (process.argv.includes('--control')) {
  const casos = [
    ['renumera lo que está en el mapa',
     'ver `L-502` y también L-503', { '502': '520', '503': '521' },
     'ver `L-520` y también L-521', 2],
    ['NO toca lo que no está en el mapa',
     'B usa L-500 y L-501', { '502': '520' }, 'B usa L-500 y L-501', 0],
    ['no encadena: 500→518 no vuelve a moverse',
     'L-500 y L-518', { '500': '518' }, 'L-518 y L-518', 1],
    ['respeta wikilinks',
     'familia con [[L-503]]', { '503': '521' }, 'familia con [[L-521]]', 1],
    ['ignora números de 4 cifras (D-1049)',
     'la ficha D-1049 y L-502', { '502': '520' }, 'la ficha D-1049 y L-520', 1],
  ];
  let malos = 0;
  console.log('CONTROL del renumerador\n');
  for (const [nombre, entrada, mapa, esperado, n] of casos) {
    const r = renumerar(entrada, mapa);
    const ok = r.salida === esperado && r.tocados === n;
    if (!ok) { malos++; console.log(`  🔴 ${nombre}\n     obtuve  : ${r.salida} (${r.tocados})\n     esperaba: ${esperado} (${n})`); }
    else console.log(`  ✅ ${nombre}`);
  }
  const m1 = mapaSano({ '500': '518', '501': '519' });
  const m2 = mapaSano({ '500': '501', '501': '502' });   // cadena: debe rebotar
  if (!m1.sano) { malos++; console.log('  🔴 mapa sano marcado como cadena'); } else console.log('  ✅ mapa sin cadena → sano');
  if (m2.sano)  { malos++; console.log('  🔴 CADENA no detectada'); } else console.log(`  ✅ cadena detectada (${m2.choques.join(',')})`);
  console.log(malos ? `\n🔴 ${malos} caso(s) mal` : '\n✅ los siete casos, como se esperaba');
  process.exit(malos ? 1 : 0);
}

const iM = process.argv.indexOf('--mapa');
if (iM === -1) { console.error('falta --mapa 500:518,501:519,…  (o --control)'); process.exit(2); }
const mapa = Object.fromEntries(process.argv[iM + 1].split(',').map((p) => p.split(':')));
const { sano, choques } = mapaSano(mapa);
if (!sano) { console.error(`🔴 el mapa encadena: ${choques.join(',')} es origen y destino. Abortado.`); process.exit(2); }

const seco = process.argv.includes('--seco');
let total = 0;
for (const { archivo, trato, razon } of TERRITORIO) {
  if (trato === 'historia') { console.log(`⏭️  ${archivo}\n     NO se toca — ${razon}`); continue; }
  const t = readFileSync(archivo, 'utf8');
  const { salida, tocados } = renumerar(t, mapa);
  total += tocados;
  console.log(`${tocados ? '✏️ ' : '  '} ${archivo}  ${tocados} cita(s)`);
  if (!seco && tocados) writeFileSync(archivo, salida);
}
console.log(`\n${seco ? '(seco) ' : ''}total: ${total} citas`);
