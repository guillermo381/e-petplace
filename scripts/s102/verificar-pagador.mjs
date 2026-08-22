#!/usr/bin/env node
/**
 * S102-B · ARNÉS DEL PAGADOR — el camino real, no la defensa supuesta.
 *
 * QUÉ PRUEBA: que un cobro de CITA nuevo nace con su pagador registrado por la
 * PUERTA (no derivado por nosotros) y que ese pagador es legible por quien
 * corresponde. Es la evidencia post-apply de la tanda de la cura 3.
 *
 * 🔴 POR QUÉ NO ALCANZA MIRAR LA COLUMNA: que `pagador_user_id` exista y esté
 * poblada NO prueba que la puerta la escriba — las 7 filas del backfill la
 * tienen y ninguna pasó por `pagos-cobro`. **El discriminador es
 * `pagador_origen`**: solo la puerta escribe `'sesion'`.
 *   *Es la lección de S101 en su forma de instrumento: verificar la MATERIA
 *    PRIMA no prueba el ARTEFACTO.*
 *
 * 🔴 L-197 — SI NO PUEDE MEDIR, SALE ROJO. Jamás verde por ausencia de datos.
 * 🔴 L-191 — el exit se lee del comando, nunca de un pipe.
 *
 * USO:
 *   node scripts/s102/verificar-pagador.mjs
 *   node scripts/s102/verificar-pagador.mjs --desde 2026-08-21T12:00:00Z
 *     (--desde acota el «cobro nuevo» a los nacidos después del deploy;
 *      sin él, toma el deploy como «cualquier fila con origen sesion»)
 *
 * SOLO LECTURA. Este arnés jamás escribe.
 */
import { dbQuery } from '../lib-db.mjs';

const arg = (n) => {
  const i = process.argv.indexOf(n);
  return i > -1 ? process.argv[i + 1] : null;
};
const desde = arg('--desde');

const fallos = [];
const notas = [];
const ok = (m) => console.log(`  ✅ ${m}`);
const mal = (m) => { fallos.push(m); console.log(`  ❌ ${m}`); };

console.log('\n═══ S102-B · ARNÉS DEL PAGADOR ═══\n');

// ── ① LA ESTRUCTURA ────────────────────────────────────────────────────────
// Si esto falla, todo lo demás mediría sobre un mundo que no existe.
console.log('① Estructura');
let hayCol = false;
try {
  const r = dbQuery(`
    select
      (select count(*) from information_schema.columns
        where table_schema='public' and table_name='pagos_intentos'
          and column_name in ('pagador_user_id','pagador_origen')) as cols,
      (select count(*) from pg_constraint
        where conrelid='public.pagos_intentos'::regclass
          and conname='chk_intento_de_cita_declara_pagador' and convalidated) as check_validado,
      (select count(*) from pg_policies
        where schemaname='public' and tablename='pagos_intentos'
          and policyname='pagos_select' and qual ilike '%pagador_user_id%') as policy_ensanchada
  `)[0];
  hayCol = Number(r.cols) === 2;
  if (hayCol) ok('las dos columnas existen'); else mal(`faltan columnas (hay ${r.cols} de 2) — la migración NO está aplicada`);
  if (Number(r.check_validado) === 1) ok('chk_intento_de_cita_declara_pagador existe y está VALIDADO');
  else mal('el CHECK no existe o no está validado — el cinturón de la tanda no está puesto');
  /* 🔴 PRECONDICIÓN, NO PRUEBA — y hay que decirlo en la pantalla o el verde
     miente. Esto es `ILIKE` sobre el TEXTO de la policy: mide lo que la policy
     DECLARA, jamás lo que HACE. Una policy podría nombrar la columna y no
     abrir nada (un brazo mal parentizado, un `AND` donde iba un `OR`).
     **La prueba vive en el bloque ⑤**, que corre como el pagador y cuenta filas.
     *Aporte de A, 21-ago: su `verify-manifest-apk` dio VERDE y tenía razón —el
      manifest estaba perfecto— mientras la APK no traía el bundle adentro.
      «Se verifica el artefacto, no la materia prima», un piso más abajo.* */
  if (Number(r.policy_ensanchada) === 1) ok('la policy pagos_select NOMBRA al pagador (precondición — la prueba es ⑤)');
  else mal('la policy NO nombra pagador_user_id — el dueño no puede ver su intento de cita');
} catch (e) {
  mal(`no se pudo leer la estructura: ${String(e.message).slice(0, 160)}`);
}

// ── ② EL BACKFILL, y que no haya huérfanas ─────────────────────────────────
console.log('\n② Backfill y cobertura');
if (!hayCol) {
  mal('SIN MEDIR — no existen las columnas. Rojo por L-197, jamás verde por ausencia.');
} else {
  try {
    const r = dbQuery(`
      select
        count(*) filter (where pagador_origen = 'backfill_s102') as backfilleadas,
        count(*) filter (where pagador_origen = 'sesion')        as por_la_puerta,
        count(*) filter (where cita_id is not null and pedido_id is null
                           and pagador_user_id is null)           as citas_huerfanas,
        count(*) filter (where pagador_user_id is not null and pagador_origen is null) as sin_procedencia
      from pagos_intentos
    `)[0];
    if (Number(r.backfilleadas) === 7) ok('las 7 históricas siguen marcadas backfill_s102');
    else mal(`el backfill marcó ${r.backfilleadas}, se esperaban 7`);
    if (Number(r.citas_huerfanas) === 0) ok('cero intentos de cita sin pagador');
    else mal(`${r.citas_huerfanas} intentos de cita SIN pagador — el CHECK no los está frenando`);
    if (Number(r.sin_procedencia) === 0) ok('ningún pagador sin procedencia declarada');
    else mal(`${r.sin_procedencia} filas con pagador y sin origen — no se puede decir si se midió o se dedujo`);
    notas.push(`filas escritas por la puerta hasta ahora: ${r.por_la_puerta}`);
  } catch (e) {
    mal(`no se pudo medir el backfill: ${String(e.message).slice(0, 160)}`);
  }
}

// ── ③ 🔴 EL CAMINO REAL — la puerta escribió, no nosotros ──────────────────
console.log('\n③ El camino real (la puerta cableada)');
if (!hayCol) {
  mal('SIN MEDIR — no existen las columnas.');
} else {
  try {
    const filtro = desde ? `and pi.creado_en >= '${desde}'::timestamptz` : '';
    const r = dbQuery(`
      select count(*) as n,
             count(*) filter (where pi.pagador_origen = 'sesion') as por_la_puerta,
             count(*) filter (where pi.pagador_origen = 'backfill_s102') as derivadas
        from pagos_intentos pi
       where pi.cita_id is not null and pi.pedido_id is null ${filtro}
    `)[0];
    if (Number(r.n) === 0) {
      mal(`SIN CASO: no hay ningún intento de cita${desde ? ' desde ' + desde : ''}. ` +
          `Un arnés sin caso NO da verde — hay que disparar un cobro de cita real y volver a correr.`);
    } else if (Number(r.por_la_puerta) === 0) {
      mal(`hay ${r.n} intento(s) de cita y NINGUNO con origen 'sesion' ` +
          `(${r.derivadas} son del backfill) ⇒ la puerta NO está cableada, o no corrió todavía.`);
    } else {
      ok(`${r.por_la_puerta} intento(s) de cita nacidos POR LA PUERTA (origen 'sesion')`);
    }
  } catch (e) {
    mal(`no se pudo medir el camino real: ${String(e.message).slice(0, 160)}`);
  }
}

// ── ④ EL COMPROBANTE PUEDE LEERLO ──────────────────────────────────────────
// No prueba a quién se lo manda (eso es la cura de D-862): prueba que el dato
// que esa cura necesita EXISTE y resuelve a una persona real.
console.log('\n④ El comprobante tiene de dónde leerlo');
if (!hayCol) {
  mal('SIN MEDIR — no existen las columnas.');
} else {
  try {
    const r = dbQuery(`
      select count(*) as con_pagador,
             count(*) filter (where u.id is not null) as resuelven_a_usuario_real
        from pagos_intentos pi
        left join auth.users u on u.id = pi.pagador_user_id
       where pi.cita_id is not null and pi.pagador_user_id is not null
    `)[0];
    if (Number(r.con_pagador) === 0) mal('no hay intentos de cita con pagador para verificar');
    else if (Number(r.con_pagador) === Number(r.resuelven_a_usuario_real))
      ok(`los ${r.con_pagador} pagadores de cita resuelven a un usuario real`);
    else mal(`${Number(r.con_pagador) - Number(r.resuelven_a_usuario_real)} pagador(es) apuntan a un usuario inexistente`);
  } catch (e) {
    mal(`no se pudo verificar la resolución del pagador: ${String(e.message).slice(0, 160)}`);
  }
}

// ── ⑤ LA POLICY, CON DISCRIMINADOR POR BRAZO ───────────────────────────────
// Sin el brazo del pedido, un verde no distingue «ensanché» de «reemplacé».
console.log('\n⑤ La policy, por brazo');
if (!hayCol) {
  mal('SIN MEDIR — no existen las columnas.');
} else {
  try {
    const uid = dbQuery(`
      select pagador_user_id::text as uid from pagos_intentos
       where cita_id is not null and pagador_user_id is not null limit 1
    `)[0]?.uid;
    if (!uid) {
      mal('SIN CASO con resultado conocido — no se puede discriminar. Un censo vacío no prueba nada.');
    } else {
      const r = dbQuery(`
        begin;
        set local request.jwt.claims = '{"sub":"${uid}","role":"authenticated"}';
        set local role authenticated;
        select count(*) filter (where cita_id is not null and pedido_id is null) as ve_citas,
               count(*) filter (where pedido_id is not null)                     as ve_pedidos
          from pagos_intentos;
        rollback;
      `)[0];
      if (Number(r.ve_citas) > 0) ok(`el pagador ve ${r.ve_citas} intento(s) de cita suyos`);
      else mal('el pagador NO ve sus intentos de cita — el brazo nuevo de la policy no abrió');
      notas.push(`ese mismo usuario ve ${r.ve_pedidos} intento(s) de pedido (brazo ② intacto)`);
    }
  } catch (e) {
    mal(`no se pudo probar la policy: ${String(e.message).slice(0, 160)}`);
  }
}

// ── VEREDICTO ──────────────────────────────────────────────────────────────
console.log('\n───────────────────────────────────────');
for (const n of notas) console.log(`  · ${n}`);
if (fallos.length === 0) {
  console.log('\n✅ ARNÉS VERDE — la puerta escribe al pagador y el dueño lo ve.\n');
  process.exit(0);
}
console.log(`\n❌ ARNÉS EN ROJO — ${fallos.length} fallo(s):`);
for (const f of fallos) console.log(`   · ${f}`);
console.log('');
process.exit(1);
