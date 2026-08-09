/**
 * LA CLASE, NO EL CASO — «decidir que no hay nada a partir de una lista vacía».
 * (v2 — la v1 dio CERO en todo, incluido el patrón que existe en 80 archivos.)
 *
 * Orden del founder tras el P0 del paseo: *«el defecto no fue el largo vs la
 * fase en UNA pantalla: fue que una advertencia escrita en la lib no se cumplió
 * y nada lo detectó»*.
 *
 * ── LA CLASE ────────────────────────────────────────────────────────────────
 * Una lista que viene de la red tiene **al menos tres estados** —todavía no
 * llegó · no pudo llegar · llegó vacía— y `lista.length === 0` **los confunde a
 * los tres**. Cuando esa comparación decide un MENSAJE, dos de los tres casos
 * producen una frase falsa. En el paseo la frase era «tu hogar todavía no tiene
 * un perro registrado» y el hogar tenía dos perros.
 *
 * ── EL ERROR DE LA v1, DECLARADO PORQUE ES LA MISMA LECCIÓN ──────────────────
 * La v1 armaba un `git grep -E` con alternancias escapadas desde un array de
 * args y devolvió **0 hits en los tres ejes**, incluido el patrón sano. Un
 * censo que devuelve cero se lee igual que «no hay nada que arreglar» — y acá
 * había 80 archivos. *Un instrumento que no se prueba miente con la misma cara
 * con la que dice la verdad* (L-192). La v2 hace UN grep simple y filtra en JS.
 *
 * ── LO QUE ESTE CENSO NO PUEDE (declarado ANTES de leerlo) ───────────────────
 * Es estático: un `.length === 0` puede decidir un layout inofensivo. Ordena la
 * mirada, no la reemplaza (L-211).
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync } from 'node:fs';
import { guardarSeg2, RAIZ, linea } from './lib-seg2.mjs';

const ejecutar = promisify(execFile);

async function grep(patron, ...paths) {
  try {
    const { stdout } = await ejecutar('git', ['grep', '-n', patron, '--', ...paths], {
      cwd: RAIZ,
      maxBuffer: 64 * 1024 * 1024,
    });
    return stdout.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

const APPS = ['apps/cliente/src', 'apps/prestador/src'];
const hits = await grep('.length === 0', ...APPS);
if (hits.length === 0) {
  linea('\n🔴 EL CENSO DEVOLVIÓ CERO — eso es un fallo del instrumento, no un dato.\n');
  process.exit(1);
}

// agrupar por archivo
const porArchivo = {};
for (const l of hits) {
  const i = l.indexOf(':');
  const j = l.indexOf(':', i + 1);
  const archivo = l.slice(0, i);
  (porArchivo[archivo] ??= []).push({ num: l.slice(i + 1, j), texto: l.slice(j + 1).trim() });
}

const informe = [];
for (const [archivo, lista] of Object.entries(porArchivo)) {
  const txt = readFileSync(`${RAIZ}/${archivo}`, 'utf8');
  const lineas = txt.split('\n');

  /** ¿la lista viene de la RED? (wrapper del api + promesa) */
  const deRed = /@epetplace\/api/.test(txt) && /(\.then\(|await\s+obtener|await\s+listar)/.test(txt);
  /** ¿el archivo modela los tres estados en ALGÚN lado? */
  const modelaFases = /'cargando'\s*\|\s*'error'|\|\s*'error'|fase:\s*'cargando'|\.fase\s*(===|!==)/.test(txt);

  /** de los hits, los que deciden un MENSAJE al usuario (no un layout) */
  const conMensaje = lista.filter((h) => {
    const ctx = lineas.slice(Math.max(0, +h.num - 5), +h.num + 8).join(' ');
    return /EstadoVacio|setSin[A-Z]|Titulo|titulo=|vacio|Vacio|mostrar\(|t\('/.test(ctx);
  });
  /** ¿ese `if` mira la fase EN LA MISMA expresión? */
  const conFaseEnElIf = conMensaje.filter((h) => /fase\s*===|fase\s*!==|'listo'/.test(h.texto));

  informe.push({
    archivo,
    deRed,
    modelaFases,
    total: lista.length,
    conMensaje: conMensaje.length,
    protegidos: conFaseEnElIf.length,
    expuestos: conMensaje.length - conFaseEnElIf.length,
    detalle: conMensaje.filter((h) => !/fase\s*===|fase\s*!==|'listo'/.test(h.texto)).slice(0, 3),
  });
}

const riesgo = informe.filter((i) => i.deRed && i.expuestos > 0).sort((a, b) => b.expuestos - a.expuestos);
const sanos = informe.filter((i) => i.protegidos > 0);

guardarSeg2('clase-vacio-ambiguo.json', { informe, riesgo });

linea('\n══ LA CLASE · «decidir que no hay nada por el largo de una lista» ══\n');
linea(`  archivos con \`.length === 0\` .................... ${informe.length}`);
linea(`  … de ellos con datos de RED ..................... ${informe.filter((i) => i.deRed).length}`);
linea(`  … que además deciden un MENSAJE al usuario ...... ${informe.filter((i) => i.deRed && i.conMensaje > 0).length}`);
linea(`  … con la FASE en la misma expresión (protegidos)  ${sanos.length}`);
linea(`\n  🔴 EXPUESTOS — de red, deciden mensaje, y ese \`if\` NO mira la fase: ${riesgo.length}\n`);
for (const r of riesgo.slice(0, 24)) {
  const marca = r.modelaFases ? '🟡' : '🔴';
  linea(`  ${marca} ${r.archivo.replace('apps/', '').padEnd(56)} ${r.expuestos} expuesto(s)${r.modelaFases ? ' · modela fases en otro lado' : ''}`);
  for (const d of r.detalle) linea(`        :${d.num}  ${d.texto.slice(0, 104)}`);
}
if (riesgo.length > 24) linea(`  … y ${riesgo.length - 24} archivos más`);
linea('\n  🟡 = el archivo SÍ conoce las fases pero ese `if` puntual no las usa.');
linea('  🔴 = el archivo no modela fases en ningún lado.\n');
