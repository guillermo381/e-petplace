#!/usr/bin/env node
/**
 * S115-A · ANTES DE RENOMBRAR UNA TABLA O UNA VISTA — el gate de D-662 extendida.
 *
 * 🔴 POR QUÉ EXISTE, con su caso real: en la tanda 1 renombré `facturas` →
 *    `documentos_fiscales`. `packages/api/src/wrappers/despensa-seguimiento.ts`
 *    hace `.from('facturas')` y lo consume una pantalla VIVA del cliente
 *    (`apps/cliente/.../pedidos/pedido/[pedidoId].tsx`). Sin cura, el detalle de
 *    pedido devolvía 400 en el bundle publicado.
 *    **Lo cazó el typecheck de casualidad** —porque ese mismo lote tocaba
 *    `packages/api`—. Si el trabajo hubiera sido puro de base, la migración salía
 *    VERDE y la pantalla rompía en producción. D-662 estaba escrita para COLUMNAS;
 *    esto la extiende a TABLAS y VISTAS.
 *
 * 🔴 TRES CÓDIGOS DE SALIDA, y ninguno se solapa (L-533):
 *      0 = SANO           · ningún consumidor en apps/ ni packages/
 *      1 = ROJO DEL PRODUCTO · hay consumidores: el rename necesita publish en el
 *                              MISMO acto, o una vista de compatibilidad
 *      2 = NO CONCLUYENTE · el instrumento no pudo medir (no encontró los árboles,
 *                           el control negativo falló, etc.)
 *    *Un instrumento que puede fallar con el mismo código que su hallazgo no está
 *    midiendo: está adivinando.*
 *
 * Uso:  node scripts/s115/verify-rename-seguro.mjs <nombre> [<nombre>...]
 *       node scripts/s115/verify-rename-seguro.mjs --control      (prueba su rojo)
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = process.cwd();
const ARBOLES = ['apps', 'packages'];
const EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']);
/* Los tipos generados NOMBRAN todas las tablas: incluirlos daría rojo siempre y
   el gate no distinguiría un consumidor de un tipo. Se excluye A PROPÓSITO. */
const EXCLUIR = [/database\.types\.ts$/, /node_modules/, /\.d\.ts$/, /dist\//, /build\//];

function archivos(dir, acc = []) {
  let entradas;
  try { entradas = readdirSync(dir); } catch { return acc; }
  for (const e of entradas) {
    const p = join(dir, e);
    let st; try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) { if (e !== 'node_modules') archivos(p, acc); continue; }
    if (!EXT.has(p.slice(p.lastIndexOf('.')))) continue;
    if (EXCLUIR.some((r) => r.test(p))) continue;
    acc.push(p);
  }
  return acc;
}

/**
 * Dos patrones, y el segundo es el que atrapa lo que el primero no ve.
 *  ① `.from('<nombre>')` — el consumidor directo de PostgREST.
 *  ② el nombre PELADO entre comillas — un `select` armado en un string, un
 *     `rpc('...')` que lo nombra, un comentario que documenta el contrato.
 * 🔴 SIN `i`: `-i` es case-insensitive y pesca subcadenas de otra cosa (a la casa
 *    ya le pasó: `celcer` pescando `cancelCeremony`). Y con delimitadores, porque
 *    `facturas` no debe pescar `facturas_historial`.
 */
function patrones(nombre) {
  const n = nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [
    { clase: 'from', re: new RegExp(`\\.from\\(\\s*['"\`]${n}['"\`]`, 'g') },
    { clase: 'nombre', re: new RegExp(`['"\`]${n}['"\`]`, 'g') },
  ];
}

function censar(nombre, lista) {
  const hits = [];
  for (const f of lista) {
    let txt; try { txt = readFileSync(f, 'utf8'); } catch { continue; }
    for (const { clase, re } of patrones(nombre)) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(txt)) !== null) {
        const linea = txt.slice(0, m.index).split('\n').length;
        hits.push({ archivo: f.replace(RAIZ + '/', ''), linea, clase });
      }
    }
  }
  return hits;
}

// ── CONTROL: el gate tiene que dar ROJO sobre un caso REAL, no sobre un fixture
//    escrito por mí para que pase. El caso real es `facturas`, que existe en el
//    árbol hoy porque la vista de compatibilidad lo mantuvo vivo.
function control(lista) {
  const problemas = [];
  const real = censar('facturas', lista);
  const desdeFrom = real.filter((h) => h.clase === 'from');
  if (desdeFrom.length === 0) {
    problemas.push('el ROJO REAL no se reprodujo: no se encontró .from(\'facturas\') en el árbol');
  }
  // NEGATIVO: un nombre que no existe tiene que dar CERO. Sin esto, un gate que
  // marcara todo daría "rojo" y parecería que funciona.
  const inventado = censar('tabla_que_no_existe_s115_zzz', lista);
  if (inventado.length !== 0) {
    problemas.push(`el control NEGATIVO falló: un nombre inventado dio ${inventado.length} hits`);
  }
  // NO-SUBCADENA: `factura` (singular) no debe pescar `facturas`.
  const sub = censar('factura', lista).filter((h) => h.clase === 'from');
  if (sub.some((h) => desdeFrom.some((d) => d.archivo === h.archivo && d.linea === h.linea))) {
    problemas.push('el matcher pesca SUBCADENAS: `factura` alcanzó una línea de `facturas`');
  }
  return { problemas, rojoReal: desdeFrom };
}

const args = process.argv.slice(2);
const lista = ARBOLES.filter((a) => existsSync(join(RAIZ, a)))
  .flatMap((a) => archivos(join(RAIZ, a)));

if (lista.length === 0) {
  console.error('NO CONCLUYENTE · no se encontró ningún archivo en apps/ ni packages/');
  console.error('  (¿se corrió desde la raíz del monorepo?)');
  process.exit(2);
}

if (args.includes('--control') || args.length === 0) {
  console.log(`corpus: ${lista.length} archivos de apps/ y packages/`);
  const { problemas, rojoReal } = control(lista);
  console.log(`ROJO REAL (.from('facturas')): ${rojoReal.length} hit(s)`);
  for (const h of rojoReal) console.log(`  ${h.archivo}:${h.linea}`);
  if (problemas.length) {
    for (const p of problemas) console.error(`CONTROL FALLÓ · ${p}`);
    process.exit(2);
  }
  console.log('control positivo, negativo y anti-subcadena: OK');
  if (args.length === 0) {
    console.log('\nuso: node scripts/s115/verify-rename-seguro.mjs <tabla_o_vista> [...]');
  }
  process.exit(0);
}

let hayConsumidores = false;
for (const nombre of args) {
  const hits = censar(nombre, lista);
  const from = hits.filter((h) => h.clase === 'from');
  const otros = hits.filter((h) => h.clase !== 'from');
  console.log(`\n══ ${nombre} ══  corpus: ${lista.length} archivos`);
  if (hits.length === 0) {
    console.log('  SANO · ningún consumidor en apps/ ni packages/');
    continue;
  }
  hayConsumidores = true;
  for (const h of from)  console.log(`  🔴 .from()  ${h.archivo}:${h.linea}`);
  for (const h of otros) console.log(`  ⚠️  nombre   ${h.archivo}:${h.linea}`);
  console.log(`  ⇒ ${from.length} consumidor(es) directo(s) · ${otros.length} mención(es)`);
}

if (hayConsumidores) {
  console.error('\n🔴 ROJO · hay bundle publicado que consulta este nombre.');
  console.error('   D-662: la migración y su publish son UN SOLO ACTO — o se renombra');
  console.error('   compatible hacia atrás (vista con el nombre viejo) y la vieja muere');
  console.error('   en una segunda pasada, DESPUÉS del publish.');
  process.exit(1);
}
console.log('\nSANO · el rename no rompe ningún consumidor conocido.');
process.exit(0);
