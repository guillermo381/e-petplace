#!/usr/bin/env node
/**
 * `verify:sin-invocador` — LA PREGUNTA QUE NINGÚN CENSO HACÍA.
 *
 * 🔴 POR QUÉ EXISTE. El censo de la casa pregunta *¿existe? ¿compila? ¿pasa sus
 *    tests?* — **nunca *¿alguien la llama?***. `L-318` («motor sin puerta») está
 *    escrita desde S101 y nunca se mecanizó: quedó como algo que hay que
 *    recordar, *y una regla que hay que recordar es una que alguien va a
 *    olvidar.* Tres instancias en un solo día (12-sep-2026) lo cobraron:
 *      ① `escribir_lineas_del_intento` — cero llamadores: **cada pago aprobado
 *         creaba un documento sin base imponible.**
 *      ② la emisión automática — el pipeline entero construido y el disparo
 *         implícito: nada se emitía solo (`D-1072`).
 *      ③ tres GATES en disco que ningún script de `package.json` invocaba — o
 *         sea que nunca corrieron; uno destapó un `.from('facturas')` vivo.
 *    ⇒ el gate tiene DOS BRAZOS, porque la clase vale para el motor **y** para
 *    los instrumentos que lo vigilan.
 *
 * 🔴 LO QUE ESTE GATE **NO** MIDE, declarado (L-459 · L-437):
 *    · No prueba que una pieza con invocador SE EJECUTE: prueba que alguien la
 *      nombra. Un llamador dentro de una rama muerta cuenta como invocador.
 *    · No alcanza a invocadores fuera de este repo — el portal admin y las
 *      webs del legado comparten esta base. Una función que sólo ellos llaman
 *      va a salir acá como huérfana: **por eso el baseline admite lápidas.**
 *    · Un nombre muy corto o muy común puede dar un falso invocador por
 *      subcadena; se busca con borde de palabra en los dos lados.
 *
 * BASELINE SOLO-BAJA: el número de hoy se congela en `.baseline-sin-invocador`.
 * Sube ⇒ ROJO. Baja ⇒ ROJO también, con el pedido de bajar el baseline: *un
 * baseline que no se actualiza al mejorar deja de medir* (L-425).
 *
 * Exit: 0 sano · 1 rojo · 2 no concluyente (L-533).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';

const BASELINE_MOTOR = '.baseline-sin-invocador-motor';
const BASELINE_GATES = '.baseline-sin-invocador-gates';
const TOPE_LISTA = 12;   // una lista de 142 no se lee: se saltea.
let salida = 0;
const linea = (s = '') => console.log(s);

/* ── BRAZO ②: GATES EN DISCO QUE NADIE INVOCA ──────────────────────────────
   Va primero porque es el más barato y el que se acaba de cobrar. */
function gatesHuerfanos() {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const registrados = JSON.stringify(pkg.scripts ?? {});
  const dirs = ['scripts', 'scripts/s115'];
  const huerfanos = [];
  for (const d of dirs) {
    if (!existsSync(d)) continue;
    for (const f of readdirSync(d)) {
      if (!/^verify-.*\.(mjs|ts|js)$/.test(f)) continue;
      /* Se busca la RUTA, no el nombre del script de npm: un gate puede estar
         registrado con cualquier alias, y lo que importa es que ALGO lo
         ejecute. También cuenta si otro script o el hook lo invoca. */
      const ruta = `${d}/${f}`;
      if (registrados.includes(ruta)) continue;
      let enHook = false;
      for (const h of ['.husky/pre-commit', '.githooks/pre-commit']) {
        if (existsSync(h) && readFileSync(h, 'utf8').includes(f)) enHook = true;
      }
      if (!enHook) huerfanos.push(ruta);
    }
  }
  return huerfanos;
}

/* ── BRAZO ①: FUNCIONES DEL MOTOR SIN NADIE QUE LAS LLAME ──────────────── */
function sql(texto) {
  const f = `/tmp/sin-invocador-${process.pid}.sql`;
  execFileSync('bash', ['-c', `cat > ${f} <<'EOF'\n${texto}\nEOF`]);
  const out = execFileSync('npx',
    ['supabase', '--experimental', 'db', 'query', '--linked', '--file', f],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
       timeout: 120000, maxBuffer: 256 * 1024 * 1024 });
  const i = out.indexOf('{');
  if (i < 0) throw new Error('la consulta no devolvió JSON');
  return JSON.parse(out.slice(i));
}

/* 🔴 UNA SOLA CONSULTA, Y LA COMPARACIÓN EN NODE. La primera versión cruzaba
   cada función contra el cuerpo de todas las demás **dentro de Postgres** —
   O(n²) sobre `pg_get_functiondef`— y **tardaba más de dos minutos**. Un gate
   que no termina no se corre, y uno que no se corre no mide nada: es la misma
   clase que este archivo vino a cazar. El motor entrega los textos una vez;
   el cruce lo hace Node en memoria. */
const CONSULTA = `
SELECT
  (SELECT jsonb_agg(p.proname ORDER BY p.proname)
     FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind = 'f')                      AS nombres,
  (SELECT string_agg(pg_get_functiondef(p.oid), E'\\n')
     FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind = 'f')                      AS cuerpos,
  (SELECT string_agg(v.definition, E'\\n') FROM pg_views v
    WHERE v.schemaname = 'public')                                       AS vistas,
  (SELECT string_agg(j.command, E'\\n') FROM cron.job j)                 AS crones,
  (SELECT jsonb_agg(DISTINCT p.proname)
     FROM pg_trigger t JOIN pg_proc p ON p.oid = t.tgfoid
    WHERE NOT t.tgisinternal)                                            AS con_trigger;`;

/* 🔴 UN SOLO BARRIDO DEL CÓDIGO, NO UNO POR FUNCIÓN. La versión anterior
   lanzaba un `grep -r` por cada una de las ~400 funciones y **tardaba más de
   dos minutos**: tres veces el mismo defecto en el mismo archivo —un gate que
   no termina no se corre, y uno que no se corre no mide nada—. Se lee el árbol
   UNA vez y el cruce va en memoria. */
function blobDelCodigo() {
  const dirs = ['packages/api/src', 'supabase/functions', 'apps'];
  let out = '';
  const salidaGrep = execFileSync('bash', ['-c',
    `grep -rhoE '[a-z_][a-z0-9_]{3,}' ${dirs.filter(existsSync).join(' ')} `
    + `--include='*.ts' --include='*.tsx' --include='*.sql' 2>/dev/null | sort -u`],
    { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  out = salidaGrep;
  return new Set(out.split('\n'));
}

let huerfanosMotor = null;
try {
  const f = (sql(CONSULTA).rows ?? [])[0] ?? {};
  const nombres = f.nombres ?? [];
  const conTrigger = new Set(f.con_trigger ?? []);
  const blob = [f.cuerpos ?? '', f.vistas ?? '', f.crones ?? ''].join('\n');
  const identificadoresDelCodigo = blobDelCodigo();
  huerfanosMotor = nombres.filter((n) => {
    if (conTrigger.has(n)) return false;
    /* Su PROPIA definición está en el blob: por eso el umbral es 2, no 1 —
       una sola aparición es la de su `CREATE FUNCTION`, no un llamador. */
    const re = new RegExp(`\\b${n}\\b`, 'g');
    if ((blob.match(re) ?? []).length >= 2) return false;
    return !identificadoresDelCodigo.has(n);
  });
} catch (e) {
  linea(`\n  ⚠️  NO CONCLUYENTE — no se pudo consultar el motor: ${String(e.message).slice(0, 140)}`);
  linea('     (el brazo de gates igual corre; el del motor queda sin medir)\n');
  salida = 2;
}

const huerfanosGates = gatesHuerfanos();

linea('\n═══ verify:sin-invocador ═══\n');
linea(`  ① MOTOR — funciones sin trigger, sin otra función, sin vista, sin cron`);
linea(`            y sin nadie que las nombre en packages/api · supabase/functions · apps`);
if (huerfanosMotor === null) {
  linea('     (no medido en esta corrida)');
} else {
  linea(`     ${huerfanosMotor.length} sin invocador`);
  for (const n of huerfanosMotor) linea(`       · ${n}`);
}
linea('');
linea(`  ② GATES en disco que ningún script de package.json ni el hook invoca`);
linea(`     ${huerfanosGates.length} sin invocador`);
for (const n of huerfanosGates.slice(0, TOPE_LISTA)) linea(`       · ${n}`);
if (huerfanosGates.length > TOPE_LISTA) {
  linea(`       … y ${huerfanosGates.length - TOPE_LISTA} más (lista completa: --todos)`);
}
if (process.argv.includes('--todos')) {
  for (const n of huerfanosGates.slice(TOPE_LISTA)) linea(`       · ${n}`);
}
linea('');
linea('  ⚠️  LO QUE ESE NÚMERO ES Y LO QUE NO ES: la mayoría son arneses de UNA');
linea('     sesión —corrieron su día, probaron su cosa y quedaron archivados—, no');
linea('     gates permanentes apagados. *Publicarlos como 142 defectos sería');
linea('     etiquetar un número con la población equivocada.* El valor del gate no');
linea('     es el número: es que NO PUEDA CRECER sin que alguien lo note.');

function gobernar(etiqueta, archivo, total) {
  const previo = existsSync(archivo) ? Number(readFileSync(archivo, 'utf8').trim()) : null;
  if (previo === null) {
    writeFileSync(archivo, `${total}\n`);
    linea(`  ${etiqueta}: baseline creado en ${total}. Desde acá SÓLO PUEDE BAJAR.`);
    return 0;
  }
  if (total > previo) {
    linea(`  🔴 ${etiqueta}: subió de ${previo} a ${total} — alguien construyó y no cableó.`);
    linea('     Cablearlo, o declarar su lápida y bajar el baseline.');
    return 1;
  }
  if (total < previo) {
    linea(`  🔴 ${etiqueta} (del bueno): bajó de ${previo} a ${total}.`);
    linea(`     Actualizá:  echo ${total} > ${archivo}`);
    linea('     *Un baseline que no se actualiza al mejorar deja de medir* (L-425).');
    return 1;
  }
  linea(`  ✅ ${etiqueta}: ${total}, igual al baseline.`);
  return 0;
}

linea('');
/* Dos baselines y no uno: si se suman, una pieza de motor huérfana nueva se
   esconde detrás de un arnés archivado que alguien borró. *Un total oculta
   compensaciones entre dos poblaciones que no tienen nada que ver.* */
if (huerfanosMotor !== null) {
  salida = Math.max(salida, gobernar('MOTOR', BASELINE_MOTOR, huerfanosMotor.length));
} else {
  linea('  MOTOR: sin medir en esta corrida — su baseline no se toca.');
}
salida = Math.max(salida, gobernar('GATES', BASELINE_GATES, huerfanosGates.length));

linea('');
linea('  Su verde dice «no NACIÓ ninguna pieza huérfana nueva».');
linea('  JAMÁS dice «las que hay están bien»: están contadas y esperan cable o lápida.');
linea('');
process.exit(salida);
