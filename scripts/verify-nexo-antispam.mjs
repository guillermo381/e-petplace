#!/usr/bin/env node
/**
 * verify:nexo-antispam — S113-E, lote 2.1 · E5.
 *
 * **Nexo avisa poco o no avisa.** Cuatro reglas, y ninguna es de gusto:
 *   ① como máximo **un aviso por tipo, por mascota, por día**
 *   ② **cero en memorial** — LOYALTY §8.1: el silencio es parte del respeto
 *   ③ **cero sin opt-in**
 *   ④ **el job NO manda push**: escribe la fila y prende los arcos del orbe
 *   ⑤ **anticipación**: como máximo **una VIVA por mascota cada 7 días**, y **nunca
 *      dos el mismo día**
 *
 * ── ⑤ SE MIDE SOBRE LAS ENTREGADAS, NO SOBRE TODAS ──────────────────────────
 * El motor produce varias por mascota y las pone **en cola**; sale una. *Contar las
 * filas de la tabla daría rojo sobre un diseño que funciona bien:* las que están en
 * cola **no le llegaron a nadie**, y ésa es toda la diferencia entre anticipar y
 * atosigar. Medido en Thor: 4 avisos, **1 entregada y 3 en cola**.
 *
 * ── ☠️ APUNTABA A UNA EDGE QUE NUNCA EXISTIÓ ────────────────────────────────
 * La primera versión buscaba `supabase/functions/nexo-avisos/`. **Ese directorio
 * no existe y no iba a existir**: el job vive en la BASE (`generar_avisos_coach`,
 * DEFINER, con cron `generar-avisos-coach` a las 12:30). Salía **2 · NO
 * CONCLUYENTE** contra un objeto imaginario, y *un gate anclado a un mundo que ya
 * cambió da no-concluyente para siempre y nadie lo mira* — que es peor que un
 * rojo, porque no pide nada.
 *
 * Los cuatro nombres se **midieron**, no se eligieron:
 *   job `generar_avisos_coach` · tabla `avisos_coach` · memorial
 *   `mascotas.estado_vida` · opt-in **`familia.avisos_nexo_desde`** (un TIMESTAMP,
 *   no un booleano: guarda desde CUÁNDO, y `NULL` es «no aceptó»).
 * *Mi patrón anterior buscaba `opt_in`/`avisos_activos` — nombres que inventé yo.*
 *
 * Salidas: 0 verde · 1 rojo · 2 NO CONCLUYENTE (el job no existe).
 *
 *   node scripts/verify-nexo-antispam.mjs --control
 *   node scripts/verify-nexo-antispam.mjs
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { exigirArgumentos } from './lib-argumentos.mjs';

exigirArgumentos(['--control'], 0);

const JOB = process.env.NEXO_JOB ?? 'generar_avisos_coach';
const TABLA = process.env.NEXO_TABLA ?? 'avisos_coach';
const di = (s) => console.log(s);

/** Señales de que el job despacha push. Nombres de la casa, no inventados. */
export const SEÑALES_PUSH = [
  'despachar-push', 'despachar_push', 'notificacion_intencion', 'push_tokens',
  'expo.dev', 'fcm.googleapis',
];

function sql(q) {
  const r = spawnSync('npx', ['supabase', '--experimental', 'db', 'query', '--linked', q],
    { encoding: 'utf8', maxBuffer: 1 << 24 });
  const i = r.stdout.indexOf('{');
  if (i === -1) return null;
  try { return JSON.parse(r.stdout.slice(i)).rows; } catch { return null; }
}

/** ④ — sobre el CUERPO del job, que es donde se rompe antes de sonar. */
export function buscaPush(nombre) {
  const patron = SEÑALES_PUSH.map((s) => s.replace(/[.\\]/g, '\\\\$&')).join('|');
  const f = sql(`select p.proname,
      (pg_get_functiondef(p.oid) ~* '${patron}') as toca_push
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='${nombre}'`);
  if (f === null) return { existe: false, motivo: 'no pude consultar la base' };
  if (!f.length) return { existe: false, motivo: `el job \`${nombre}\` no existe en la base` };
  return { existe: true, tocaPush: f[0].toca_push === true };
}

/**
 * ⑤ — el brazo de la anticipación, sobre las ENTREGADAS.
 * `avisos`: [{ mascota_id, dia, estado }]
 */
export function juzgarAnticipacion(avisos, { ventanaDias = 7 } = {}) {
  const rojos = [];
  const vivas = avisos.filter((a) => a.estado === 'entregado');
  const porMascota = new Map();
  for (const a of vivas) {
    if (!porMascota.has(a.mascota_id)) porMascota.set(a.mascota_id, []);
    porMascota.get(a.mascota_id).push(a.dia);
  }
  for (const [m, dias] of porMascota) {
    const orden = [...dias].sort();
    /* «dos el mismo día» se nombra aparte aunque la ventana lo cubra: es el caso
       que la familia SIENTE, y decir «dos en 7 días» cuando fueron el mismo día
       describe el hecho de menos. */
    const mismoDia = orden.filter((d, i) => i > 0 && d === orden[i - 1]);
    if (mismoDia.length) rojos.push({ regla: '⑤ dos el mismo día', detalle: `${mismoDia.length + 1} anticipaciones VIVAS el ${mismoDia[0]} a la misma mascota` });
    for (let i = 1; i < orden.length; i += 1) {
      const dif = (Date.parse(orden[i]) - Date.parse(orden[i - 1])) / 86400000;
      if (dif > 0 && dif < ventanaDias) {
        rojos.push({ regla: '⑤ ventana de 7 días', detalle: `dos anticipaciones VIVAS a ${dif} día(s) (${orden[i - 1]} → ${orden[i]})` });
      }
    }
  }
  return rojos;
}

/**
 * ①②③ — el juez sobre los avisos que el job produjo.
 * `avisos`: [{ mascota_id, tipo, dia, memorial, opt_in }]
 */
export function juzgarAvisos(avisos) {
  const rojos = [];
  const vistos = new Map();
  for (const a of avisos) {
    if (a.memorial) rojos.push({ regla: '② memorial', detalle: `${a.tipo} sobre una mascota en memorial` });
    if (a.opt_in === false) rojos.push({ regla: '③ opt-in', detalle: `${a.tipo} sin opt-in` });
    const k = `${a.mascota_id}|${a.tipo}|${a.dia}`;
    vistos.set(k, (vistos.get(k) ?? 0) + 1);
  }
  for (const [k, n] of vistos) if (n > 1) {
    const [, tipo, dia] = k.split('|');
    rojos.push({ regla: '① uno por día', detalle: `${n} avisos de «${tipo}» el ${dia} a la misma mascota` });
  }
  return rojos;
}

/** Los avisos REALES, con su memorial y su opt-in resueltos en la misma consulta. */
function avisosReales() {
  return sql(`select a.mascota_id::text as mascota_id, a.tipo,
                     coalesce(a.estado,'entregado') as estado,
                     to_char(coalesce(a.entregado_en, a.creado_en),'YYYY-MM-DD') as dia,
                     (m.estado_vida <> 'activa') as memorial,
                     (f.avisos_nexo_desde is not null) as opt_in
              from ${TABLA} a
              join mascotas m on m.id = a.mascota_id
              join familia f on f.id = m.familia_id`);
}

/* Corre sólo si lo invocan a él: importarlo para reusar su juez no puede
   disparar el gate ni su `process.exit()`. Ya me pasó tres veces. */
const ESTE = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

// ═══ CONTROL ═══════════════════════════════════════════════════════════════
if (ESTE && process.argv.includes('--control')) {
  let fallos = 0;
  const ok = (b, et, d = '') => { di(`${b ? '✅' : '🔴'} ${et}${d ? '  ' + d : ''}`); if (!b) fallos += 1; };
  const base = { mascota_id: 'm1', dia: '2026-09-06', memorial: false, opt_in: true };

  ok(juzgarAvisos([base]).length === 0 && juzgarAvisos([{ ...base, tipo: 'vacuna' }, { ...base, tipo: 'cita' }]).length === 0,
    'NEGATIVO  un aviso, y dos de tipos distintos el mismo día, no son spam');
  ok(juzgarAvisos([{ ...base, tipo: 'vacuna' }, { ...base, tipo: 'vacuna' }]).some((r) => r.regla.startsWith('①')),
    'POSITIVO  dos del MISMO tipo el mismo día salen ROJO');
  ok(juzgarAvisos([{ ...base, tipo: 'vacuna' }, { ...base, tipo: 'vacuna', dia: '2026-09-07' }]).length === 0,
    'CLASE     el mismo tipo en días distintos NO es spam — el techo es por día');
  ok(juzgarAvisos([{ ...base, tipo: 'v', memorial: true }]).some((r) => r.regla.startsWith('②')),
    'POSITIVO  un aviso en memorial sale ROJO');
  ok(juzgarAvisos([{ ...base, tipo: 'v', opt_in: false }]).some((r) => r.regla.startsWith('③')),
    'POSITIVO  un aviso sin opt-in sale ROJO');
  ok(juzgarAvisos([{ ...base, tipo: 'v', mascota_id: 'm1' }, { ...base, tipo: 'v', mascota_id: 'm2' }]).length === 0,
    'CLASE     el mismo tipo a DOS mascotas el mismo día no es spam — el techo es por mascota');

  /* ⑤ EL BRAZO DE LA ANTICIPACIÓN, con el caso REAL de Thor: 4 producidas, 1 viva. */
  const thor = [
    { mascota_id: 'thor', dia: '2026-09-07', estado: 'entregado' },
    { mascota_id: 'thor', dia: '2026-09-07', estado: 'en_cola' },
    { mascota_id: 'thor', dia: '2026-09-07', estado: 'en_cola' },
    { mascota_id: 'thor', dia: '2026-09-07', estado: 'en_cola' },
  ];
  ok(juzgarAnticipacion(thor).length === 0,
    'NEGATIVO  ⑤ Thor: 4 producidas y 1 VIVA no es spam — las 3 en cola no le llegaron a nadie');
  ok(juzgarAnticipacion(thor.map((a) => ({ ...a, estado: 'entregado' }))).some((r) => r.regla.includes('mismo día')),
    'POSITIVO  ⑤ si las CUATRO salieran vivas el mismo día, ROJO y se dice cuántas');
  ok(juzgarAnticipacion([
    { mascota_id: 'm', dia: '2026-09-01', estado: 'entregado' },
    { mascota_id: 'm', dia: '2026-09-04', estado: 'entregado' }]).some((r) => r.regla.includes('ventana')),
    'POSITIVO  ⑤ dos vivas a 3 días caen en la ventana de 7');
  ok(juzgarAnticipacion([
    { mascota_id: 'm', dia: '2026-09-01', estado: 'entregado' },
    { mascota_id: 'm', dia: '2026-09-08', estado: 'entregado' }]).length === 0,
    'CLASE     ⑤ dos vivas a 7 días exactos NO es rojo — la ventana es abierta');
  ok(juzgarAnticipacion([
    { mascota_id: 'a', dia: '2026-09-07', estado: 'entregado' },
    { mascota_id: 'b', dia: '2026-09-07', estado: 'entregado' }]).length === 0,
    'CLASE     ⑤ una viva a CADA mascota el mismo día no es spam — el techo es por mascota');

  /* ④ contra objetos REALES de la base: uno que sí despacha y uno que no.
     Un detector probado sólo contra un fixture no probó nada (L-459). */
  const conPush = buscaPush('despachar_notificaciones');
  const sinPush = buscaPush(JOB);
  ok(sinPush.existe && sinPush.tocaPush === false,
    `NEGATIVO  el job real (\`${JOB}\`) no toca el camino del push`);
  ok(!buscaPush('funcion_que_no_existe_s113e').existe,
    'POSITIVO  sin job el gate NO puede dar verde');
  if (conPush.existe) ok(conPush.tocaPush === true, 'POSITIVO  el detector ve el push donde SÍ lo hay');
  else di('⚠️ CONTROL INCOMPLETO: no hallé una función de la casa que sí despache push para el positivo de ④.');

  di('');
  if (fallos) { di(`🔴 ${fallos} control(es) en rojo.`); process.exit(1); }
  di('✅ caza las cinco y no acusa a quien se porta bien.');
  process.exit(0);
}

// ═══ GATE ══════════════════════════════════════════════════════════════════
const j = buscaPush(JOB);
if (ESTE) {
if (!j.existe) {
  di(`⚠️ NO CONCLUYENTE — ${j.motivo}.`);
  di('   Las cuatro reglas y su juez quedan escritos y probados (--control).');
  process.exit(2);
}
const filas = avisosReales();
if (filas === null) { di('⚠️ NO CONCLUYENTE — no pude leer los avisos de la base.'); process.exit(2); }

di(`verify:nexo-antispam · job \`${JOB}\` · tabla \`${TABLA}\` · ${filas.length} aviso(s) producido(s)`);
const rojos = juzgarAvisos(filas.filter((a) => a.estado === 'entregado'));
const anticipa = filas.filter((a) => a.tipo === (process.env.NEXO_TIPO_ANTICIPA ?? 'anticipacion'));
rojos.push(...juzgarAnticipacion(anticipa));
const vivas = anticipa.filter((a) => a.estado === 'entregado').length;
di(`   anticipación: ${anticipa.length} producida(s) · ${vivas} viva(s) · ${anticipa.length - vivas} en cola`);
if (j.tocaPush) rojos.push({ regla: '④ el job no manda push', detalle: 'el cuerpo del job toca el camino del push' });

if (rojos.length) {
  di(`\n🔴 ${rojos.length} incumplimiento(s):`);
  for (const r of rojos) di(`   ${r.regla.padEnd(24)} ${r.detalle}`);
  if (j.tocaPush) di('   Un aviso de Nexo prende un arco y escribe una fila. No vibra un teléfono.');
  process.exit(1);
}
di(`✅ ① uno por tipo/mascota/día · ② cero en memorial · ③ cero sin opt-in · ④ el job no toca el push · ⑤ una anticipación viva por mascota cada 7 días.`);
if (!filas.length) di('   ⚠️ con CERO avisos producidos, ①②③ pasan por vacío: el verde dice «no hay spam», no «el job funciona».');

}
